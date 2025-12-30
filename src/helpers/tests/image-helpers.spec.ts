import { describe, expect, test } from 'vitest';
import { getFileEnding } from '../image-helpers';

describe('Image Extension Extraction', () => {
    test('should handle standard URLs', () => {
        expect(getFileEnding('https://example.com/image.jpg')).toBe('jpg');
        expect(getFileEnding('https://example.com/image.png')).toBe('png');
        expect(getFileEnding('https://example.com/image.webp')).toBe('webp');
    });

    test('should handle URLs with query parameters', () => {
        expect(getFileEnding('https://example.com/image.jpg?width=100')).toBe('jpg');
        expect(getFileEnding('https://example.com/image.jpg?width=100&height=100')).toBe('jpg');
    });

    test('should handle URLs with fragments', () => {
        expect(getFileEnding('https://example.com/image.jpg#top')).toBe('jpg');
    });

    test('should handle encoded query markers (%3F)', () => {
        const url = 'recipe-images/M2sagpZH3dlTXZ94tPi9o.jpg%3Fresize%3D480%252C480%26amp%3Bssl%3D1';
        expect(getFileEnding(url)).toBe('jpg');
    });

    test('should handle case-insensitive encoded query markers (%3f)', () => {
        const url = 'recipe-images/M2sagpZH3dlTXZ94tPi9o.jpg%3fresize%3D480';
        expect(getFileEnding(url)).toBe('jpg');
    });

    test('should default to jpg if no extension found', () => {
        expect(getFileEnding('https://example.com/image')).toBe('jpg');
        expect(getFileEnding('https://example.com/archive.tar.gz')).toBe('gz');
    });
});
