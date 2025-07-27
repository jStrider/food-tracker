import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddUserRolesPermissions1700000000000
  implements MigrationInterface
{
  name = "AddUserRolesPermissions1700000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add roles column with default value
    await queryRunner.addColumn(
      "users",
      new TableColumn({
        name: "roles",
        type: "text",
        default: "'[\"user\"]'",
        isNullable: false,
      }),
    );

    // Add permissions column with default value
    await queryRunner.addColumn(
      "users",
      new TableColumn({
        name: "permissions",
        type: "text",
        default: "'[]'",
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("users", "permissions");
    await queryRunner.dropColumn("users", "roles");
  }
}
