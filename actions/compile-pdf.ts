"use server";

import fs from "fs/promises";
import path from "path";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export type CompilePdfResult = {
  success: boolean;
  pdfBase64?: string;
  error?: string;
  logs?: string;
};

export async function compilePdf(latexString: string): Promise<CompilePdfResult> {
  // Create a unique temporary directory
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "resumate-"));
  const texFilePath = path.join(tempDir, "resume.tex");
  
  try {
    // Write LaTeX content to file
    await fs.writeFile(texFilePath, latexString, "utf-8");

    // Run pdflatex safely
    // -interaction=nonstopmode prevents it from blocking on user input for errors
    // -no-shell-escape disables execution of dangerous external commands
    // -output-directory ensures all auxiliary files stay in the temp dir
    const command = `pdflatex -interaction=nonstopmode -no-shell-escape -output-directory="${tempDir}" "${texFilePath}"`;
    
    let logs = "";
    try {
      const { stdout, stderr } = await execAsync(command, { 
        cwd: tempDir,
        timeout: 60000 // 60 seconds timeout to prevent hanging, allows MiKTeX auto-install
      });
      logs = (stdout || "") + "\n" + (stderr || "");
    } catch (execError: any) {
      // pdflatex returns non-zero exit code if compilation fails
      logs = (execError.stdout || "") + "\n" + (execError.stderr || "");
      
      // If error is related to command not found
      if (execError.code === 127 || execError.message.includes("not recognized") || execError.message.includes("ENOENT")) {
        return {
          success: false,
          error: "LaTeX distribution (pdflatex) is not installed or not in PATH. Please install MiKTeX or TeX Live to compile locally.",
          logs: execError.message
        };
      }
      
      return {
        success: false,
        error: "LaTeX compilation failed. Please check the logs for syntax errors.",
        logs
      };
    }

    // Read the generated PDF
    const pdfPath = path.join(tempDir, "resume.pdf");
    
    try {
      const pdfBuffer = await fs.readFile(pdfPath);
      const pdfBase64 = pdfBuffer.toString("base64");

      return {
        success: true,
        pdfBase64,
        logs
      };
    } catch (readError: any) {
      return {
        success: false,
        error: "Compilation completed, but PDF file was not found. The LaTeX code might not have produced any output pages.",
        logs
      };
    }

  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred during PDF compilation.",
    };
  } finally {
    // Gracefully clean up temporary directory and all its contents
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error("Failed to clean up temporary directory:", cleanupError);
    }
  }
}
