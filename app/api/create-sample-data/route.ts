import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateFullTextEmbedding, prepareCompleteJobForEmbedding } from '@/lib/embeddingService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle individual job creation
    if (body.action === 'create_job') {
      console.log('🔧 Creating individual job with embedding...');
      const jobData = body.jobData;
      
      // First, create a dummy company user if it doesn't exist
      const companyEmail = `${jobData.company_name.toLowerCase().replace(/\s+/g, '')}@example.com`;
      
      // Check if company user exists
      let { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', companyEmail)
        .single();
      
      let companyUserId;
      
      if (!existingUser) {
        // Create company user
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            clerk_user_id: `dummy_${Date.now()}_${Math.random()}`,
            role: 'company',
            email: companyEmail,
            name: jobData.company_name
          })
          .select()
          .single();
          
        if (userError) {
          throw new Error(`Failed to create company user: ${userError.message}`);
        }
        
        companyUserId = newUser.id;
        console.log(`✅ Created company user: ${jobData.company_name}`);
      } else {
        companyUserId = existingUser.id;
      }
      
      // Create job with embedding
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert({
          company_id: companyUserId,
          role: jobData.role,
          location: jobData.location,
          work_mode: jobData.work_mode,
          duration_months: jobData.duration_months,
          job_type: jobData.job_type,
          requirements: jobData.requirements,
          description: jobData.description,
          company_name: jobData.company_name,
          stipend_amount: jobData.stipend_amount,
          stipend_currency: jobData.stipend_currency,
          stipend_type: jobData.stipend_type,
          embedding: jobData.embedding
        })
        .select()
        .single();
        
      if (jobError) {
        throw new Error(`Failed to create job: ${jobError.message}`);
      }
      
      console.log(`✅ Created job: ${jobData.role} at ${jobData.company_name}`);
      
      return NextResponse.json({
        success: true,
        message: 'Job created successfully',
        job: job
      });
    }
    
    // Original bulk creation logic
    console.log('🏢 Creating sample companies and jobs for testing...');

    // First, create sample company users
    const sampleCompanies = [
      {
        clerk_user_id: `company_test_${Date.now()}_1`,
        role: 'company',
        email: 'hr@techcorp.com',
        name: 'TechCorp Solutions'
      },
      {
        clerk_user_id: `company_test_${Date.now()}_2`,
        role: 'company',
        email: 'recruiting@innovateai.com',
        name: 'InnovateAI Labs'
      },
      {
        clerk_user_id: `company_test_${Date.now()}_3`,
        role: 'company',
        email: 'careers@designstudio.com',
        name: 'Creative Design Studio'
      }
    ];

    console.log('👥 Creating sample companies...');
    const { data: createdCompanies, error: companiesError } = await supabase
      .from('users')
      .insert(sampleCompanies)
      .select();

    if (companiesError) {
      throw new Error(`Failed to create companies: ${companiesError.message}`);
    }

    console.log(`✅ Created ${createdCompanies.length} sample companies`);

    // Sample job postings with diverse requirements
    const sampleJobs = [
      {
        company_id: createdCompanies[0].id,
        role: 'Frontend Developer',
        location: 'San Francisco, CA',
        work_mode: 'remote',
        duration_months: 6,
        job_type: 'full-time',
        description: 'We are looking for a skilled Frontend Developer to join our dynamic team. You will be responsible for building responsive web applications using modern frameworks like React and Vue.js. The ideal candidate should have experience with JavaScript, HTML5, CSS3, and state management libraries.',
        requirements: 'Requirements: 2+ years experience with React.js, JavaScript ES6+, HTML5, CSS3, responsive design, Git version control, REST API integration, state management (Redux/Zustand), TypeScript knowledge preferred, experience with modern build tools (Webpack, Vite), understanding of web performance optimization.'
      },
      {
        company_id: createdCompanies[0].id,
        role: 'Full Stack Engineer',
        location: 'New York, NY',
        work_mode: 'hybrid',
        duration_months: 12,
        job_type: 'full-time',
        description: 'Join our engineering team as a Full Stack Engineer working on cutting-edge web applications. You will work with both frontend and backend technologies, designing scalable systems and implementing new features. Experience with cloud platforms and microservices architecture is highly valued.',
        requirements: 'Requirements: Strong proficiency in JavaScript/TypeScript, React.js or Vue.js, Node.js, Express.js, database design (PostgreSQL/MongoDB), cloud platforms (AWS/Azure), Docker containers, microservices architecture, RESTful API design, Git workflow, agile development methodology.'
      },
      {
        company_id: createdCompanies[1].id,
        role: 'Data Scientist',
        location: 'Boston, MA',
        work_mode: 'onsite',
        duration_months: 12,
        job_type: 'full-time',
        description: 'We are seeking a Data Scientist to analyze complex datasets and build machine learning models. You will work with large-scale data processing, statistical analysis, and predictive modeling. The role involves collaborating with cross-functional teams to deliver data-driven insights.',
        requirements: 'Requirements: Python programming, machine learning libraries (scikit-learn, TensorFlow, PyTorch), statistical analysis, data visualization (matplotlib, seaborn, plotly), SQL and database management, big data tools (Spark, Hadoop), cloud platforms (AWS/GCP), R programming, deep learning knowledge, experience with MLOps.'
      },
      {
        company_id: createdCompanies[1].id,
        role: 'Machine Learning Engineer',
        location: 'Seattle, WA',
        work_mode: 'remote',
        duration_months: 12,
        job_type: 'full-time',
        description: 'Looking for an ML Engineer to develop and deploy machine learning models at scale. You will work on building ML pipelines, model optimization, and production deployment. Experience with MLOps, model monitoring, and distributed computing is essential.',
        requirements: 'Requirements: Python, machine learning frameworks (TensorFlow, PyTorch, Keras), MLOps tools (MLflow, Kubeflow), cloud ML services (AWS SageMaker, Google AI Platform), Docker and Kubernetes, model deployment and monitoring, distributed computing, data engineering skills, CI/CD pipelines.'
      },
      {
        company_id: createdCompanies[2].id,
        role: 'UI/UX Designer',
        location: 'Los Angeles, CA',
        work_mode: 'hybrid',
        duration_months: 6,
        job_type: 'contract',
        description: 'We are looking for a creative UI/UX Designer to create intuitive and engaging user experiences. You will work on web and mobile applications, conducting user research, creating wireframes, prototypes, and high-fidelity designs. Collaboration with developers and product managers is key.',
        requirements: 'Requirements: Proficiency in design tools (Figma, Sketch, Adobe XD), user research and usability testing, wireframing and prototyping, responsive design principles, design systems and component libraries, HTML/CSS knowledge, mobile app design experience, user-centered design methodology.'
      },
      {
        company_id: createdCompanies[2].id,
        role: 'Product Designer',
        location: 'Austin, TX',
        work_mode: 'remote',
        duration_months: 9,
        job_type: 'full-time',
        description: 'Join our product team as a Product Designer focusing on user-centered design. You will be responsible for the entire design process from concept to implementation, working closely with product managers and engineers to deliver exceptional user experiences.',
        requirements: 'Requirements: Product design experience, user research methodologies, design thinking process, prototyping tools (Figma, Principle, Framer), interaction design, visual design skills, usability testing, design systems, cross-functional collaboration, Agile/Scrum experience.'
      },
      {
        company_id: createdCompanies[0].id,
        role: 'DevOps Engineer',
        location: 'Denver, CO',
        work_mode: 'remote',
        duration_months: 12,
        job_type: 'full-time',
        description: 'We need a DevOps Engineer to manage our cloud infrastructure and CI/CD pipelines. You will be responsible for automating deployment processes, monitoring system performance, and ensuring high availability of our applications.',
        requirements: 'Requirements: AWS/Azure/GCP cloud platforms, Docker and Kubernetes, CI/CD pipelines (Jenkins, GitHub Actions, GitLab CI), infrastructure as code (Terraform, CloudFormation), monitoring tools (Prometheus, Grafana), Linux system administration, scripting (Bash, Python), networking and security.'
      },
      {
        company_id: createdCompanies[1].id,
        role: 'Backend Developer',
        location: 'Chicago, IL',
        work_mode: 'hybrid',
        duration_months: 8,
        job_type: 'full-time',
        description: 'Looking for a Backend Developer to build scalable server-side applications. You will work with databases, APIs, and microservices architecture. Experience with cloud platforms and containerization is preferred.',
        requirements: 'Requirements: Strong programming skills in Python, Java, or Node.js, database design and management (PostgreSQL, MongoDB), RESTful API development, microservices architecture, cloud platforms (AWS/Azure), Docker containers, message queues (RabbitMQ, Kafka), caching strategies (Redis), API security.'
      }
    ];

    console.log('💼 Creating sample jobs with embeddings...');
    const createdJobs = [];

    for (const jobData of sampleJobs) {
      try {
        // Prepare full text for embedding
        const fullTextForEmbedding = prepareCompleteJobForEmbedding(jobData);
        
        // Generate embedding
        console.log(`🧠 Generating embedding for ${jobData.role}...`);
        const embedding = await generateFullTextEmbedding(fullTextForEmbedding);
        
        // Insert job with embedding
        const { data: insertedJob, error: jobError } = await supabase
          .from('jobs')
          .insert({
            ...jobData,
            embedding: `[${embedding.join(',')}]` // pgvector format
          })
          .select()
          .single();

        if (jobError) {
          console.error(`❌ Failed to create job ${jobData.role}:`, jobError);
        } else {
          console.log(`✅ Created job: ${jobData.role} with ${embedding.length}D embedding`);
          createdJobs.push(insertedJob);
        }
      } catch (error) {
        console.error(`❌ Error processing job ${jobData.role}:`, error);
      }
    }

    console.log(`🎉 Sample data creation completed!`);

    return NextResponse.json({
      success: true,
      message: 'Sample companies and jobs created successfully',
      created: {
        companies: createdCompanies.length,
        jobs: createdJobs.length
      },
      companies: createdCompanies.map(c => ({ id: c.id, name: c.name, email: c.email })),
      jobs: createdJobs.map(j => ({ 
        id: j.id, 
        role: j.role, 
        company_name: createdCompanies.find(c => c.id === j.company_id)?.name,
        location: j.location,
        work_mode: j.work_mode
      })),
      next_steps: [
        'Sample data created successfully',
        'Now upload a resume to test recommendations',
        'The recommendation system should find matching jobs',
        'Check the candidate dashboard for AI-powered matches'
      ]
    });

  } catch (error) {
    console.error('🚨 Sample data creation failed:', error);
    return NextResponse.json({
      error: 'Failed to create sample data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
