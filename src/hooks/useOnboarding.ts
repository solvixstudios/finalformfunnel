import { addDoc, collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Check whether a user has completed onboarding.
 * Reads the fast `onboardingCompleted` flag on the user document.
 */
export const checkOnboardingStatus = async (userId: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data()?.onboardingCompleted === true;
    }
    // No user doc yet → hasn't completed onboarding
    return false;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

export interface OnboardingResponses {
  teamSize: string;
  businessSize: string;
  referralSource: string;
}

/**
 * Submit the onboarding survey and mark onboarding as completed.
 * Creates a document in users/{userId}/surveys and sets the
 * `onboardingCompleted` flag on the user document.
 */
export const submitOnboardingSurvey = async (
  userId: string,
  responses: OnboardingResponses
): Promise<void> => {
  const now = new Date().toISOString();

  // 1. Write survey response to subcollection
  await addDoc(collection(db, 'users', userId, 'surveys'), {
    surveyType: 'onboarding',
    version: 1,
    responses,
    completedAt: now,
    createdAt: now,
  });

  // 2. Set the fast-check flag on the user document
  await setDoc(
    doc(db, 'users', userId),
    { onboardingCompleted: true, updatedAt: now },
    { merge: true }
  );
};
