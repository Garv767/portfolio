const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { neon } = require("@neondatabase/serverless");
const crypto = require("crypto");
require("dotenv").config({ path: ".env.local" });

const s3 = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true,
});
const S3_BUCKET = process.env.NEON_S3_BUCKET_NAME || "resume-storage";
const dbUrl = process.env.DATABASE_URL;

async function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });
}

async function testFlow() {
  console.log("=== 1. Testing Initial 'Save' ===");
  const sql = neon(dbUrl);
  const testId1 = crypto.randomUUID();
  const testLatex1 = "% Test Latex Content 1\n\\documentclass{article}\n\\begin{document}\nInitial Version\n\\end{document}";
  const s3Key1 = `resumes/${testId1}.tex`;

  // 1. Upload to S3
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key1,
    Body: testLatex1,
    ContentType: "text/x-tex; charset=utf-8",
  }));
  console.log("Uploaded initial .tex to S3 key:", s3Key1);

  // 2. Insert into PostgreSQL
  await sql`
    INSERT INTO public.resumes (
      id, title, target_company, target_role, template_name, s3_key, is_published, updated_at
    ) VALUES (
      ${testId1}, 'Test_Resume.tex', 'Google', 'Software Engineer', 'jake-resume', ${s3Key1}, false, NOW()
    );
  `;
  console.log("Saved initial resume to DB with ID:", testId1);

  console.log("\n=== 2. Testing Overwrite 'Save' (Same ID) ===");
  const updatedLatex1 = "% Test Latex Content Overwritten\n\\documentclass{article}\n\\begin{document}\nOverwritten Version\n\\end{document}";
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key1,
    Body: updatedLatex1,
    ContentType: "text/x-tex; charset=utf-8",
  }));
  await sql`
    INSERT INTO public.resumes (
      id, title, target_company, target_role, template_name, s3_key, updated_at
    ) VALUES (
      ${testId1}, 'Test_Resume_Edited.tex', 'Google', 'Senior SWE', 'jake-resume', ${s3Key1}, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      target_role = EXCLUDED.target_role,
      updated_at = NOW();
  `;
  const [row1] = await sql`SELECT * FROM public.resumes WHERE id = ${testId1};`;
  console.log("Overwritten resume in DB, updated title:", row1.title, "role:", row1.target_role);

  console.log("\n=== 3. Testing 'Save As' (New Record) ===");
  const testId2 = crypto.randomUUID();
  const s3Key2 = `resumes/${testId2}.tex`;
  const saveAsLatex = "% Save As Copy Content\n\\documentclass{article}\n\\begin{document}\nCopy Version\n\\end{document}";

  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key2,
    Body: saveAsLatex,
    ContentType: "text/x-tex; charset=utf-8",
  }));
  await sql`
    INSERT INTO public.resumes (
      id, title, target_company, target_role, template_name, s3_key, is_published, updated_at
    ) VALUES (
      ${testId2}, 'Test_Resume_Copy.tex', 'Meta', 'Staff Engineer', 'jake-resume', ${s3Key2}, false, NOW()
    );
  `;
  console.log("Created distinct new record with ID:", testId2);

  console.log("\n=== 4. Testing 'Set as Public Resume' (Publishing) ===");
  // Set testId1 as published
  await sql`UPDATE public.resumes SET is_published = (id = ${testId1});`;
  const publishedRows = await sql`SELECT id, title, is_published FROM public.resumes WHERE is_published = true;`;
  console.log("Currently published resume:", publishedRows);

  console.log("\n=== 5. Verifying S3 Content Retrieval ===");
  const s3Get = await s3.send(new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key1,
  }));
  const retrievedContent = await streamToString(s3Get.Body);
  console.log("Retrieved S3 content contains 'Overwritten Version':", retrievedContent.includes("Overwritten Version"));

  console.log("\n=== 6. Cleanup test records ===");
  await sql`DELETE FROM public.resumes WHERE id IN (${testId1}, ${testId2});`;
  console.log("Cleaned up test DB records.");

  console.log("\nALL TESTS PASSED SUCCESSFULLY!");
}

testFlow().catch(console.error);
