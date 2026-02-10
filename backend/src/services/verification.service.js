const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class VerificationService {
    async verifyStudentId(imagePath) {
        return new Promise((resolve, reject) => {
            // Path to python script
            // Assuming backend is at /project/backend, and script is at /project/ai-research/verify_student.py
            const scriptPath = path.resolve(__dirname, '../../../ai-research/verify_student.py');

            // Prefer Python 3.12 Framework path as we confirmed it has dependencies
            const frameworkPath312 = '/Library/Frameworks/Python.framework/Versions/3.12/bin/python3';
            const venvPath = path.resolve(__dirname, '../../../../.venv/bin/python');

            let pythonCmd = 'python3'; // Default to python3, not python (which is v2/missing)

            if (fs.existsSync(frameworkPath312)) {
                pythonCmd = frameworkPath312;
            } else if (fs.existsSync(venvPath)) {
                pythonCmd = venvPath;
            }

            const command = `"${pythonCmd}" "${scriptPath}" "${imagePath}" --json-output`;

            console.log(`Executing verification command: ${command}`);

            exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
                if (stderr) {
                    console.error(`Verification Script Stderr: ${stderr}`);
                }

                if (error && error.code !== 0 && error.code !== 2) {
                    // Code 2 is verification failure, which is "success" in execution but failed verification logic
                    // Other codes are actual execution errors
                    console.error(`Verification Script Execution Error: ${error.message}`);
                    return reject(new Error('Failed to execute verification script'));
                }

                try {
                    // stdout should contain the JSON result
                    const result = JSON.parse(stdout.trim());
                    resolve(result);
                } catch (parseError) {
                    console.error('Failed to parse verification result:', stdout);
                    reject(new Error('Invalid response from verification service'));
                }
            });
        });
    }
}

module.exports = new VerificationService();
