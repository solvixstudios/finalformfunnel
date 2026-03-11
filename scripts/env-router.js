import { execSync } from 'child_process';

const command = process.argv[2];

if (!command) {
    console.error('❌ Please specify a command (e.g., build, deploy)');
    process.exit(1);
}

try {
    // Get current git branch
    const branch = execSync('git branch --show-current').toString().trim();

    let env = '';
    if (branch === 'main' || branch === 'master') {
        env = 'prod';
    } else if (branch === 'dev') {
        env = 'dev';
    } else {
        console.warn(`⚠️  Warning: Unrecognized branch "${branch}". Defaulting to "dev" environment.`);
        env = 'dev';
    }

    const fullCommand = `npm run ${command}-${env}`;
    console.log(`\n🚀 Branch is "${branch}". Routing to: ${fullCommand}\n`);

    // Execute the mapped command, preserving colors and stdio
    execSync(fullCommand, { stdio: 'inherit' });

} catch (error) {
    console.error('\n❌ Error executing command:', error.message);
    process.exit(1);
}
