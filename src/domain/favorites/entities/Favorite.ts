export class Favorite {
  constructor(
    public readonly userId: string,
    public readonly placeId: string,
    public readonly createdAt: Date,
  ) {}
}
