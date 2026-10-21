const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { neon } = require("@neondatabase/serverless");
const { S3Client, ListBucketsCommand, ListObjectsV2Command, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");

async function testDatabase() {
  console.log("\n--- Testing Neon PostgreSQL ---");
  const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!connectionString) {
    console.error("❌ No DATABASE_URL found in environment");
    return;
  }
  
  try {
    const sql = neon(connectionString);
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log("✅ Neon DB Connected! Tables found:", tables.map(t => t.table_name));

    // Check portfolio_projects table count
    const projectCount = await sql`SELECT COUNT(*) FROM portfolio_projects`;
    console.log(`📊 portfolio_projects rows: ${projectCount[0].count}`);

    // Check saved_resumes table count
    const resumeCount = await sql`SELECT COUNT(*) FROM saved_resumes`;
    console.log(`📄 saved_resumes rows: ${resumeCount[0].count}`);
  } catch (err) {
    console.error("❌ Neon DB Error:", err.message);
  }
}

async function testS3Storage() {
  console.log("\n--- Testing Neon S3 Storage ---");
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || "us-east-2";

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    console.error("❌ Missing S3 credentials");
    return;
  }

  const s3 = new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });

  try {
    const listRes = await s3.send(new ListBucketsCommand({}));
    console.log("✅ Neon S3 Connected! Buckets:", listRes.Buckets?.map(b => b.Name) || "None");
    
    // Test uploading master_context.md if bucket exists
    if (listRes.Buckets && listRes.Buckets.length > 0) {
      const bucketName = listRes.Buckets[0].Name;
      console.log(`Testing upload of master_context.md to bucket '${bucketName}'...`);
      
      const sampleContent = `# Master Career & Profile Context\n- Name: Garv Rahut\n- Target: Software Engineer / AI / Full Stack\n- GitHub: https://github.com/garv767\n`;
      await s3.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: "master_context.md",
        Body: sampleContent,
        ContentType: "text/markdown",
      }));
      console.log(`✅ Uploaded 'master_context.md' to '${bucketName}' successfully!`);

      // Test retrieving it
      const getRes = await s3.send(new GetObjectCommand({
        Bucket: bucketName,
        Key: "master_context.md",
      }));
      const body = await getRes.Body.transformToString();
      console.log(`📥 Read back 'master_context.md' (${body.length} chars)`);
    }
  } catch (err) {
    console.error("❌ Neon S3 Error:", err.message);
  }
}

async function run() {
  await testDatabase();
  await testS3Storage();
  console.log("\nFinished tests.");
}

run();
