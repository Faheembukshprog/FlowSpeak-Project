using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlowSpeak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRefreshTokenToAppUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "RefreshTokenExpiresAt",
                table: "AppUsers",
                newName: "RefreshTokenExpiryTime");

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Products",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Products_SKU",
                table: "Products",
                column: "SKU",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Products_SKU",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Products");

            migrationBuilder.RenameColumn(
                name: "RefreshTokenExpiryTime",
                table: "AppUsers",
                newName: "RefreshTokenExpiresAt");
        }
    }
}
