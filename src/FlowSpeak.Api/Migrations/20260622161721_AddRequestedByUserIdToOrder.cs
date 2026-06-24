using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlowSpeak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRequestedByUserIdToOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RequestedBy",
                table: "Orders");

            migrationBuilder.AddColumn<Guid>(
                name: "RequestedByUserId",
                table: "Orders",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddUniqueConstraint(
                name: "AK_AppUsers_ExternalId",
                table: "AppUsers",
                column: "ExternalId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_RequestedByUserId",
                table: "Orders",
                column: "RequestedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_AppUsers_RequestedByUserId",
                table: "Orders",
                column: "RequestedByUserId",
                principalTable: "AppUsers",
                principalColumn: "ExternalId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_AppUsers_RequestedByUserId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_RequestedByUserId",
                table: "Orders");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_AppUsers_ExternalId",
                table: "AppUsers");

            migrationBuilder.DropColumn(
                name: "RequestedByUserId",
                table: "Orders");

            migrationBuilder.AddColumn<string>(
                name: "RequestedBy",
                table: "Orders",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);
        }
    }
}
