import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export function initAuth(
  onSuccess: (user: User, token: string) => void,
  onFailure: () => void
) {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      if (cachedAccessToken) {
        onSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        onFailure();
      }
    } else {
      cachedAccessToken = null;
      onFailure();
    }
  });
}

export async function loginWithGoogle(): Promise<{ user: User; accessToken: string }> {
  isSigningIn = true;
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google Drive access token পাওয়া যায়নি।');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
}

export async function logoutGoogle(): Promise<void> {
  await signOut(auth);
  cachedAccessToken = null;
}

export function getCachedAccessToken(): string | null {
  return cachedAccessToken;
}

export async function saveAppDataToGoogleDrive(
  accessToken: string,
  dataObj: object,
  fileName = 'SohojHisab_DriveData.json'
): Promise<{ fileId: string; webViewLink?: string }> {
  // First search if SohojHisab_DriveData.json already exists in Drive
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name%3D'${encodeURIComponent(
      fileName
    )}'%20and%20trashed%3Dfalse`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const searchJson = await searchRes.json();
  const existingFile = searchJson.files?.[0];

  const fileContent = JSON.stringify(dataObj, null, 2);
  const fileMetadata = {
    name: fileName,
    mimeType: 'application/json',
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' })
  );
  form.append('file', new Blob([fileContent], { type: 'application/json' }));

  let uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  let method = 'POST';

  if (existingFile?.id) {
    uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`;
    method = 'PATCH';
  }

  const uploadRes = await fetch(uploadUrl, {
    method,
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Google Drive আপলোড ব্যর্থ হয়েছে: ${errText}`);
  }

  const result = await uploadRes.json();
  return { fileId: result.id, webViewLink: result.webViewLink };
}

export async function loadAppDataFromGoogleDrive(
  accessToken: string,
  fileName = 'SohojHisab_DriveData.json'
): Promise<any | null> {
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name%3D'${encodeURIComponent(
      fileName
    )}'%20and%20trashed%3Dfalse`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const searchJson = await searchRes.json();
  const existingFile = searchJson.files?.[0];

  if (!existingFile?.id) {
    return null;
  }

  const fileRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!fileRes.ok) {
    throw new Error('Google Drive থেকে ডেটা ডাউনলোড করা যায়নি।');
  }

  return await fileRes.json();
}
