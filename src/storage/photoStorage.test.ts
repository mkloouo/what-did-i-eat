import * as FileSystem from 'expo-file-system/legacy';
import { savePickedPhoto, deletePhotoFile } from './photoStorage';

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///doc/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  copyAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

describe('savePickedPhoto', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates the photos directory if it does not exist, then copies the file', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });

    const destUri = await savePickedPhoto('file:///tmp/picked.jpg', 'abc123');

    expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith(
      'file:///doc/photos/',
      { intermediates: true }
    );
    expect(FileSystem.copyAsync).toHaveBeenCalledWith({
      from: 'file:///tmp/picked.jpg',
      to: 'file:///doc/photos/abc123.jpg',
    });
    expect(destUri).toBe('file:///doc/photos/abc123.jpg');
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

  it('deletes the file when it exists', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });

    await deletePhotoFile('file:///doc/photos/abc123.jpg');

    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
      'file:///doc/photos/abc123.jpg',
      { idempotent: true }
    );
  });

  it('does nothing when the file does not exist', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });

    await deletePhotoFile('file:///doc/photos/missing.jpg');

    expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
  });
});
