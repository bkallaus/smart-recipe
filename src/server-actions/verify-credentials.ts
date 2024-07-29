'use server';
import { OAuth2Client } from 'google-auth-library';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import type { User } from '@/types/user';

const client = new OAuth2Client();

const getToken = () => {
    const cookie = cookies();

    const recipeToken = cookie.get('recipe-token');

    return recipeToken;
};

// When should I verify?
const verifyCookies = async (): Promise<string | null> => {
    const recipeToken = getToken();

    if (!recipeToken?.value) {
        return null;
    }

    const ticket = await client.verifyIdToken({
        idToken: recipeToken.value,
        audience:
            '283295300739-5stqmhh5f1b3k50scpqe747cfb2lo85r.apps.googleusercontent.com',
    });

    const payload = ticket.getPayload();

    if (!payload?.email) {
        return null;
    }

    return payload.email;
};

export const getEmail = () => {
    const recipeToken = getToken();

    if (!recipeToken?.value) {
        return null;
    }

    const decoded = jwtDecode(recipeToken?.value) as { name: string };

    return decoded.name;
};

export const getUser = (): User | null => {
    const recipeToken = getToken();

    if (!recipeToken?.value) {
        return null;
    }

    const decoded = jwtDecode(recipeToken?.value) as {
        email: string;
        name: string;
    };

    return {
        email: decoded.email,
        name: decoded.name,
    };
};

export const hasAccess = () => {
    const recipeToken = getToken();

    return !!recipeToken?.value;
};
