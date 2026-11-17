'use file';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export function initAuth(
  onSuccess?: (user: User, token: string) => void,
  onFailure?: () => void
) {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      if (cachedAccessToken) {
        if (onSuccess) onSuccess(user, cachedAccessToken);
      } else if (!isSigningIn && onFailure) {
        onFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onFailure) onFailure();
    }
  });
}

export async function googleSignIn(): Promise<{ user: User; accessToken: string } | null> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google access token not found');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (err) {
    console.error('Google Sign-in error:', err);
    throw err;
  } finally {
    isSigningIn = false;
  }
}

export async function logoutGoogle(): Promise<void> {
  await auth.signOut();
  cachedAccessToken = null;
}

export async function getAccessToken(): Promise<string | null> {
  return cachedAccessToken;
}

export async function uploadBackupToDrive(
  accessToken: string,
  backupJSON: string,
  fileName = `SohojHisab_DriveBackup_${new Date().toISOString().slice(0, 10)}.json`
): Promise<{ fileId: string; webViewLink?: string }> {
  // First search if SohojHisab_DriveBackup.json already exists in Drive to update it or create new
  const query = encodeURIComponent(`name = '${fileName}' and trashed = false`);
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const searchData = await searchRes.json();
  const existingFile = searchData.files?.[0];

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', new Blob([backupJSON], { type: 'application/json' }));

  if (existingFile?.id) {
    // Update existing file
    const updateRes = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      }
    );
    const updated = await updateRes.json();
    return { fileId: updated.id };
  } else {
    // Create new file
    const createRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      }
    );
    const created = await createRes.json();
    return { fileId: created.id };
  }
}

export async function listDriveBackups(accessToken: string): Promise<Array<{ id: string; name: string; modifiedTime: string }>> {
  const query = encodeURIComponent("name contains 'SohojHisab' and trashed = false");
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const data = await res.json();
  return data.files || [];
}

export async function downloadDriveBackup(accessToken: string, fileId: string): Promise<string> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return await res.text();
}
