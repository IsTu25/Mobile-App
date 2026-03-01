const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class VerificationService {
    async verifyId(imagePath, idType, idNumber) {
        return new Promise((resolve, reject) => {
            // Path to python script
            const scriptPath = path.resolve(__dirname, '../../../ai-research/verify_student.py');

            // Prefer Python 3.12 Framework path as we confirmed it has dependencies
            const frameworkPath312 = '/Library/Frameworks/Python.framework/Versions/3.12/bin/python3';
            const venvPath = path.resolve(__dirname, '../../../../.venv/bin/python');

            let pythonCmd = 'python3';

            if (fs.existsSync(frameworkPath312)) {
                pythonCmd = frameworkPath312;
            } else if (fs.existsSync(venvPath)) {
                pythonCmd = venvPath;
            }

            // Command now includes idType and idNumber
            const command = `"${pythonCmd}" "${scriptPath}" "${imagePath}" "${idType}" "${idNumber}" --json-output`;

            console.log(`Executing verification command: ${command}`);

            exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
                if (stderr) {
                    console.error(`Verification Script Stderr: ${stderr}`);
                }

                if (error && error.code !== 0 && error.code !== 2) {
                    console.error(`Verification Script Execution Error: ${error.message}`);
                    return reject(new Error('Failed to execute verification script'));
                }

                try {
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
