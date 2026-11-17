import "server-only";
import {S3Client} from "@aws-sdk/client-s3";
export function r2Bucket(){const v=process.env.R2_BUCKET;if(!v)throw new Error("R2_BUCKET missing");return v;}
export function createR2Client(){
 const id=process.env.R2_ACCOUNT_ID,key=process.env.R2_ACCESS_KEY_ID,secret=process.env.R2_SECRET_ACCESS_KEY;
 if(!id||!key||!secret)throw new Error("R2 is not configured");
 return new S3Client({region:"auto",endpoint:"https://"+id+".r2.cloudflarestorage.com",forcePathStyle:true,credentials:{accessKeyId:key,secretAccessKey:secret}});
}
export function r2ObjectKey(projectId:string,jobId:string,platform:string){return "native-builds/"+projectId+"/"+jobId+"/app."+(platform==="ios"?"ipa":"apk");}
