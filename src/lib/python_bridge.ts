import { spawn } from 'child_process';
import path from 'path';

export async function getVideoTranscript(videoId: string): Promise<{ success: boolean; transcript?: string; error?: string }> {
    return new Promise((resolve) => {
        const scriptPath = path.join(process.cwd(), 'scripts', 'get_transcript.py');
        const pythonProcess = spawn('python', [scriptPath, videoId]);

        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorString += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                resolve({ success: false, error: errorString || `Process exited with code ${code}` });
                return;
            }

            try {
                const result = JSON.parse(dataString);
                resolve(result);
            } catch (e) {
                resolve({ success: false, error: 'Failed to parse Python output' });
            }
        });
    });
}
