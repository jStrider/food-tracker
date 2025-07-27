import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddUserPassword1732630000000 implements MigrationInterface {
  name = "AddUserPassword1732630000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "users",
      new TableColumn({
        name: "password",
        type: "varchar",
        isNullable: false,
        default: "'temp_password'", // Valeur temporaire pour les users existants
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("users", "password");
  }
}
