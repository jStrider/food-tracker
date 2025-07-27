import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export enum FoodSource {
  MANUAL = "manual",
  OPENFOODFACTS = "openfoodfacts",
  USDA = "usda",
}

@Entity("foods")
@Index(["barcode", "source"]) // Composite index for efficient barcode searches
@Index(["name"]) // Index for name searches
export class Food {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  brand?: string;

  @Column({ nullable: true })
  barcode?: string;

  @Column({
    type: "varchar",
    enum: FoodSource,
    default: FoodSource.MANUAL,
  })
  source: FoodSource;

  // OpenFoodFacts specific fields
  @Column({ nullable: true })
  openFoodFactsId?: string; // Original OFF product ID

  @Column({ type: "json", nullable: true })
  openFoodFactsData?: {
    code: string;
    product_name?: string;
    brands?: string;
    categories?: string;
    ingredients_text?: string;
    allergens?: string;
    traces?: string;
    nutriscore_grade?: string;
    nova_group?: number;
    ecoscore_grade?: string;
    packaging?: string;
    countries?: string;
    last_modified_t?: number;
  };

  // Nutrition per 100g
  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  calories: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  protein: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  carbs: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  fat: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  fiber: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  sugar: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  sodium: number;

  // Additional nutritional info from OpenFoodFacts
  @Column("decimal", { precision: 10, scale: 2, default: 0, nullable: true })
  saturatedFat?: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0, nullable: true })
  transFat?: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0, nullable: true })
  cholesterol?: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0, nullable: true })
  potassium?: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0, nullable: true })
  vitaminA?: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0, nullable: true })
  vitaminC?: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0, nullable: true })
  calcium?: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0, nullable: true })
  iron?: number;

  @Column({ default: "100g" })
  servingSize: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ type: "text", nullable: true })
  ingredients?: string;

  @Column({ type: "simple-array", nullable: true })
  allergens?: string[];

  @Column({ type: "simple-array", nullable: true })
  categories?: string[];

  // Cache and sync tracking
  @Column({ default: false })
  isCached: boolean; // True if this is a frequently used food cached locally

  @Column({ type: "timestamp", nullable: true })
  lastSyncedAt?: Date; // Last time data was synced from OpenFoodFacts

  @Column({ default: 0 })
  usageCount: number; // How many times this food has been used

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Calculate nutritional quality score
  get nutritionScore(): number {
    const scores = [];

    // Protein score (higher is better)
    if (this.protein > 20) scores.push(5);
    else if (this.protein > 10) scores.push(4);
    else if (this.protein > 5) scores.push(3);
    else scores.push(2);

    // Fiber score (higher is better)
    if (this.fiber > 10) scores.push(5);
    else if (this.fiber > 5) scores.push(4);
    else if (this.fiber > 3) scores.push(3);
    else scores.push(2);

    // Sugar score (lower is better)
    if (this.sugar < 5) scores.push(5);
    else if (this.sugar < 10) scores.push(4);
    else if (this.sugar < 20) scores.push(3);
    else scores.push(2);

    // Sodium score (lower is better)
    if (this.sodium < 140) scores.push(5);
    else if (this.sodium < 400) scores.push(4);
    else if (this.sodium < 800) scores.push(3);
    else scores.push(2);

    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  // Check if data needs refreshing from OpenFoodFacts
  get needsSync(): boolean {
    if (this.source !== FoodSource.OPENFOODFACTS) return false;
    if (!this.lastSyncedAt) return true;

    const daysSinceSync =
      (Date.now() - this.lastSyncedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceSync > 30; // Sync monthly
  }

  // Mark as frequently used for caching
  incrementUsage(): void {
    this.usageCount++;
    if (this.usageCount >= 5 && !this.isCached) {
      this.isCached = true;
    }
  }
}
