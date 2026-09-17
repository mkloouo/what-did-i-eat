import { photoStackLayout } from './PhotoStack';

describe('photoStackLayout', () => {
  it('gives a single photo one primary tile and no thumbnails', () => {
    expect(photoStackLayout(1)).toEqual({ primaryCount: 1, thumbnailCount: 0 });
  });

  it('gives two photos two primary tiles and no thumbnails', () => {
    expect(photoStackLayout(2)).toEqual({ primaryCount: 2, thumbnailCount: 0 });
  });

  it('caps primary tiles at two and pushes the rest into overlapping thumbnails', () => {
    expect(photoStackLayout(3)).toEqual({ primaryCount: 2, thumbnailCount: 1 });
    expect(photoStackLayout(4)).toEqual({ primaryCount: 2, thumbnailCount: 2 });
    expect(photoStackLayout(7)).toEqual({ primaryCount: 2, thumbnailCount: 5 });
  });
});
