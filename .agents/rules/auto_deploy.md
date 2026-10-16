# Auto-Deploy Workflow Rule

After completing any code update, feature modification, or bug fix requested by the user:
1. Verify the project builds cleanly (`npm run build`).
2. Automatically commit the changes with a concise semantic commit message (`git add <files> && git commit -m "..."`).
3. Push directly to GitHub (`git push origin main`).
4. Trigger production deployment to Vercel (`npx vercel --prod --yes`).
5. Report the commit and live production link (`https://meadsland.vercel.app`) in the summary.

The user has explicitly granted full permission to perform these actions automatically after every update without prompting.
