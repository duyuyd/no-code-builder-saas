export function siteUrl():URL{
 const configured=process.env.NEXT_PUBLIC_SITE_URL;
 const candidate=configured&&/^https:\/\//.test(configured)?configured:"https://no-code-builder-saas.vercel.app";
 return new URL(candidate.replace(/\/$/,""));
}
