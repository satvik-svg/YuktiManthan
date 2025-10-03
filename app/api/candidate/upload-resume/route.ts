import { NextRequest, NextResponse } from 'next/server';
import { validateUserAndRole } from '@/lib/auth';
import { parseDocument, validateFileType, validateFileSize, extractDataWithAI } from '@/lib/documentParser';
import { generateFullTextEmbedding, prepareCompleteResumeForEmbedding } from '@/lib/embeddingService';
import { insertResumeWithEmbedding } from '@/lib/vectorSearch';

export async function POST(request: NextRequest) {
  console.log('🚀 Starting resume upload process with full-text embeddings...');
  
  try {
    // Validate user authentication and role
    console.log('🔐 Validating user authentication...');
    const user = await validateUserAndRole('candidate');
    console.log('✅ User validated:', { userId: user.userId, role: user.role });
    
    // Parse form data
    console.log('📦 Parsing form data...');
    const formData = await request.formData();
    const file = formData.get('resume') as File;
    
    if (!file) {
      console.log('❌ No file found in form data');
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    console.log('📄 File received:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Validate file
    if (!validateFileType(file)) {
      console.log('❌ Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Invalid file type. Please upload PDF or DOCX files only.' },
        { status: 400 }
      );
    }

    if (!validateFileSize(file, 5)) {
      console.log('❌ File too large:', file.size);
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    console.log(`📄 Processing resume upload for user ${user.userId}`);

    // Parse document to extract text
    console.log('🔍 Starting document parsing...');
    let parsedText: string;
    
    try {
      parsedText = await parseDocument(file);
      console.log(`✅ Extracted ${parsedText.length} characters from document`);
      console.log('📝 First 200 characters:', parsedText.substring(0, 200));
    } catch (parseError) {
      console.error('❌ PDF parsing failed:', parseError);
      
      // Check if it's a PDF format error
      if (parseError instanceof Error && parseError.message.includes('FastAPI service error')) {
        return NextResponse.json({
          success: false,
          error: 'Invalid PDF format',
          message: 'The uploaded file appears to be corrupted or not a valid text-based PDF. Please ensure you upload a proper resume PDF with readable text content.',
          userAction: 'Please try uploading a different PDF file that contains readable text.',
          fileName: file.name
        }, { status: 400 });
      }
      
      // For other parsing errors
      return NextResponse.json({
        success: false,
        error: 'PDF parsing failed',
        message: 'Unable to extract text from the uploaded PDF. Please ensure the file is a valid resume PDF.',
        userAction: 'Please try uploading a different PDF file.',
        fileName: file.name
      }, { status: 400 });
    }

    // Extract structured data using AI
    console.log('🤖 Extracting structured data with AI...');
    const structuredData = await extractDataWithAI(parsedText);
    console.log(`✅ Extracted ${structuredData.skills.length} skills, ${structuredData.education.length} education entries`);
    console.log('🎯 Skills extracted:', structuredData.skills);
    console.log('🎓 Education extracted:', structuredData.education);

    // Prepare full text for embedding generation
    console.log('📝 Preparing full resume text for embedding...');
    const fullTextForEmbedding = prepareCompleteResumeForEmbedding({
      parsed_text: parsedText,
      skills: structuredData.skills,
      education: structuredData.education,
      experience: structuredData.experience
    });

    // Generate full-text embedding
    console.log('🧠 Generating full-text embedding...');
    const embedding = await generateFullTextEmbedding(fullTextForEmbedding);
    console.log(`✅ Generated ${embedding.length}-dimensional embedding`);

    // For now, we'll store the resume without file storage
    // TODO: Set up Supabase storage bucket for file uploads
    const file_url = `temp_resume_${user.userId}_${Date.now()}.pdf`; // Temporary file reference
    
    console.log('💾 Saving resume data to database with full-text embedding...');

    // Insert resume data into database using enhanced vector search utilities
    const resumeData = {
      user_id: user.dbUserId,
      file_url: file_url,
      parsed_text: parsedText,
      skills: structuredData.skills, // This will be converted to JSONB by Supabase
      education: structuredData.education, // This will be converted to JSONB by Supabase
      experience: structuredData.experience, // This will be converted to JSONB by Supabase
      embedding: embedding
    };

    const insertedResume = await insertResumeWithEmbedding(resumeData);
    console.log(`✅ Resume saved to database with ID: ${insertedResume.id}`);

    return NextResponse.json({
      success: true,
      message: 'Resume uploaded and processed successfully with full-text embedding',
      data: {
        resumeId: insertedResume.id,
        fileName: file.name,
        fileUrl: file_url,
        extractedSkills: structuredData.skills,
        embeddingDimensions: embedding.length,
        parsedTextLength: parsedText.length,
        fullTextLength: fullTextForEmbedding.length,
        vectorReady: true
      }
    });

  } catch (error) {
    console.error('Resume upload error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: 'Failed to process resume upload'
      },
      { status: 500 }
    );
  }
}
