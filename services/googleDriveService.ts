
import { GoogleUser } from '../types';

/**
 * Simulates signing the user into their Google account.
 * @returns A promise that resolves with mocked user data.
 */
export const signIn = async (): Promise<GoogleUser> => {
  console.log("Simulating Google Sign-In...");
  await new Promise(res => setTimeout(res, 500));
  return {
    name: 'Dev User',
    email: 'dev.user@example.com',
    picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
  };
};

/**
 * Simulates showing a file picker to open a file from Google Drive.
 * @returns A promise that resolves with mocked file data.
 */
export const openFile = async (): Promise<{ id: string; name:string; content: string }> => {
  console.log("Simulating Google Picker for opening a file...");
  await new Promise(res => setTimeout(res, 800));
  return {
    id: `mock-drive-file-${Date.now()}`,
    name: 'My Document from Drive.md',
    content: '# Hello from Google Drive!\n\nThis content was "loaded" from a file selected in the Google Picker.',
  };
};

/**
 * Simulates saving a new file to Google Drive.
 * @param fileName The name of the file to save.
 * @param content The content of the file.
 * @param folderName Optional name of the folder to save into.
 * @returns A promise that resolves with the new mocked file ID.
 */
export const saveNewFile = async (fileName: string, content: string, folderName: string = 'Markdown Redactor 2.0'): Promise<{ id: string }> => {
  console.log(`Simulating save of new file "${fileName}" to Google Drive folder "${folderName}"...`);
  await new Promise(res => setTimeout(res, 1200));
  return {
    id: `mock-drive-file-${Date.now()}`
  };
};

/**
 * Simulates updating an existing file on Google Drive.
 * @param fileId The ID of the file to update.
 * @param content The new content for the file.
 */
export const updateFile = async (fileId: string, content: string): Promise<void> => {
  console.log(`Simulating update of Drive file "${fileId}"...`);
  await new Promise(res => setTimeout(res, 800));
  return;
};
