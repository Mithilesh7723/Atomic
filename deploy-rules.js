const { spawn } = require('child_process');
const readline = require('readline');

// Function to run Firebase commands
function runFirebaseCommand(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`Running: firebase ${command} ${args.join(' ')}`);
    
    const process = spawn('npx', ['firebase', command, ...args]);
    
    process.stdout.on('data', (data) => {
      console.log(`${data}`);
    });
    
    process.stderr.on('data', (data) => {
      console.error(`${data}`);
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log(`Command completed successfully with code ${code}`);
        resolve();
      } else {
        console.error(`Command failed with code ${code}`);
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  try {
    // Prompt for login if needed
    const loginAnswer = await new Promise(resolve => {
      rl.question('Do you need to login to Firebase? (y/n): ', resolve);
    });
    
    if (loginAnswer.toLowerCase() === 'y') {
      await runFirebaseCommand('login', []);
    }
    
    // Deploy database rules
    console.log('\nDeploying database rules...');
    await runFirebaseCommand('deploy', ['--only', 'database']);
    
    // Set CORS configuration for storage
    console.log('\nSetting CORS configuration for storage...');
    const projectId = 'project-x-be8bd'; // Replace with your project ID if different
    await runFirebaseCommand('storage:cors', ['--project', projectId, 'set', 'cors.json']);
    
    console.log('\nDeployment completed successfully!');
  } catch (error) {
    console.error('Deployment failed:', error);
  } finally {
    rl.close();
  }
}

main(); 