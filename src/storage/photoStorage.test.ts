import * as FileSystem from 'expo-file-system/legacy';
import { savePickedPhoto, deletePhotoFile, resolvePhotoUri } from './photoStorage';

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///doc/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  copyAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

describe('resolvePhotoUri', () => {
  it('turns a stored relative path into an absolute URI', () => {
    expect(resolvePhotoUri('photos/abc123.jpg')).toBe('file:///doc/photos/abc123.jpg');
  });
});

describe('savePickedPhoto', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates the photos directory if it does not exist, then copies the file', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });

    const relativePath = await savePickedPhoto('file:///tmp/picked.jpg', 'abc123');

    expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith(
      'file:///doc/photos/',
      { intermediates: true }
    );
    expect(FileSystem.copyAsync).toHaveBeenCalledWith({
      from: 'file:///tmp/picked.jpg',
      to: 'file:///doc/photos/abc123.jpg',
    });
    expect(relativePath).toBe('photos/abc123.jpg');
  });

  it('does not recreate the directory if it already exists', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });

    await savePickedPhoto('file:///tmp/picked2.jpg', 'def456');

    expect(FileSystem.makeDirectoryAsync).not.toHaveBeenCalled();
  });
});

describe('deletePhotoFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes the file when it exists, resolving the relative path first', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });

    await deletePhotoFile('photos/abc123.jpg');

    expect(FileSystem.getInfoAsync).toHaveBeenCalledWith('file:///doc/photos/abc123.jpg');
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
      'file:///doc/photos/abc123.jpg',
      { idempotent: true }
    );
  });

  it('does nothing when the file does not exist', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });

    await deletePhotoFile('photos/missing.jpg');

    expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
  });
});
