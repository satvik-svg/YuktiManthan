import { NextRequest, NextResponse } from 'next/server';
import { validateUserAndRole } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const PYTHON_AI_SERVICE_URL = process.env.PYTHON_AI_SERVICE_URL || process.env.AI_SERVICE_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  console.log('🚀 Starting enhanced resume upload with Python AI processing...');
  
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

    // Validate file type and size
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      console.log('❌ Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      console.log('❌ File too large:', file.size);
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Create FormData for Python AI service
    const aiFormData = new FormData();
    aiFormData.append('file', file);

    console.log('🤖 Sending file to Python AI service for processing...');
    
    // Call Python AI service for parsing and embedding
    const aiResponse = await fetch(`${PYTHON_AI_SERVICE_URL}/parse-resume`, {
      method: 'POST',
      body: aiFormData,
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ Python AI service error:', errorText);
      return NextResponse.json(
        { error: 'Failed to process resume with AI service' },
        { status: 500 }
      );
    }

    const aiResult = await aiResponse.json();
    
    if (!aiResult.success) {
      console.error('❌ AI processing failed:', aiResult);
      return NextResponse.json(
        { error: 'AI processing failed' },
        { status: 500 }
      );
    }

    console.log('✅ AI processing completed successfully');
    console.log('📊 Extracted data:', {
      textLength: aiResult.data.text_length,
      skillsCount: aiResult.data.skills.length,
      educationCount: aiResult.data.education.length,
      experienceCount: aiResult.data.experience.length,
      embeddingDimensions: aiResult.data.embedding_dimensions
    });

    // Store file in Supabase Storage (optional - you can skip this if you don't need file storage)
    const fileName = `${user.dbUserId}/${Date.now()}-${file.name}`;
    const fileBytes = await file.arrayBuffer();
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, fileBytes, {
        contentType: 'application/pdf',
        upsert: false
      });

    let fileUrl = null;
    if (!uploadError && uploadData) {
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);
      fileUrl = publicUrl;
      console.log('✅ File uploaded to storage:', fileUrl);
    } else {
      console.warn('⚠️ File storage failed, proceeding without file URL:', uploadError);
    }

    // Insert resume data into database with embedding
    console.log('💾 Inserting resume data into database...');
    
    const { data: insertData, error: insertError } = await supabase
      .from('resumes')
      .insert({
        user_id: user.dbUserId,
        file_url: fileUrl,
        parsed_text: aiResult.data.parsed_text,
        skills: aiResult.data.skills,
        education: aiResult.data.education,
        experience: aiResult.data.experience,
        embedding: aiResult.data.embedding, // Store as array directly
        embedding_model: 'all-MiniLM-L6-v2',
        embedding_created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting resume:', insertError);
      return NextResponse.json(
        { error: 'Failed to save resume data' },
        { status: 500 }
      );
    }

    console.log('✅ Resume data saved successfully:', insertData.id);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Resume uploaded and processed successfully',
      data: {
        resumeId: insertData.id,
        extractedData: {
          textLength: aiResult.data.text_length,
          skillsCount: aiResult.data.skills.length,
          educationCount: aiResult.data.education.length,
          experienceCount: aiResult.data.experience.length,
          contactInfo: aiResult.data.contact_info
        },
        aiProcessing: {
          embeddingGenerated: true,
          embeddingDimensions: aiResult.data.embedding_dimensions,
          model: 'all-MiniLM-L6-v2'
        },
        fileStored: !!fileUrl
      }
    });

  } catch (error) {
    console.error('❌ Resume upload failed:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
