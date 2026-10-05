using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RentaTool.Shared.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEscrowModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "damage_claims",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    booking_id = table.Column<Guid>(type: "uuid", nullable: false),
                    filed_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    damage_description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    evidence_photos_json = table.Column<string>(type: "jsonb", nullable: false),
                    proposed_deduction = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    final_deduction = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    adjudication_notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    adjudicated_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    adjudicated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_damage_claims", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "escrow_holds",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    booking_id = table.Column<Guid>(type: "uuid", nullable: false),
                    renter_id = table.Column<Guid>(type: "uuid", nullable: false),
                    owner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    deposit_amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    pre_auth_transaction_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    held_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    settled_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_escrow_holds", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "payments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    claim_id = table.Column<Guid>(type: "uuid", nullable: true),
                    booking_id = table.Column<Guid>(type: "uuid", nullable: false),
                    payer_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    recipient_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    payment_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    gateway_transaction_ref = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payments", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "workflow_state_audits",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    claim_id = table.Column<Guid>(type: "uuid", nullable: false),
                    workflow_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    current_state = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    agent_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    tool_calls_log = table.Column<string>(type: "jsonb", nullable: false),
                    decision_summary = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    human_review_decision = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_workflow_state_audits", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_damage_claims_booking_id",
                table: "damage_claims",
                column: "booking_id");

            migrationBuilder.CreateIndex(
                name: "IX_damage_claims_status",
                table: "damage_claims",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_escrow_holds_booking_id",
                table: "escrow_holds",
                column: "booking_id");

            migrationBuilder.CreateIndex(
                name: "IX_escrow_holds_status",
                table: "escrow_holds",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_payments_booking_id",
                table: "payments",
                column: "booking_id");

            migrationBuilder.CreateIndex(
                name: "IX_payments_claim_id",
                table: "payments",
                column: "claim_id");

            migrationBuilder.CreateIndex(
                name: "IX_workflow_state_audits_claim_id",
                table: "workflow_state_audits",
                column: "claim_id");

            migrationBuilder.CreateIndex(
                name: "IX_workflow_state_audits_workflow_id",
                table: "workflow_state_audits",
                column: "workflow_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "damage_claims");

            migrationBuilder.DropTable(
                name: "escrow_holds");

            migrationBuilder.DropTable(
                name: "payments");

            migrationBuilder.DropTable(
                name: "workflow_state_audits");
        }
    }
}
