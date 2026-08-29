-- One-time seed: inserts a starter "Standard Service Agreement" template
-- into agreement_templates for the (single) org in this workspace. Run
-- once via the Supabase SQL editor; safe to edit further afterward from
-- the app's Agreement Templates page.

insert into agreement_templates (org_id, name, body)
values (
  (select id from organizations limit 1),
  'Standard Service Agreement',
  $body$This Service Agreement ("Agreement") is entered into as of {{start_date}}, by and between {{org_name}} ("Service Provider") and {{client_name}}, located at {{client_address}} ("Client").

1. Services Provided.
The Service Provider agrees to perform the following services for the Client: {{services_description}}.

2. Term.
This Agreement will commence on {{start_date}} and will continue until {{end_date}}, or until completion of the services described above, whichever occurs first.

3. Compensation.
Client agrees to pay Service Provider at a rate of {{hourly_rate}} per hour for the services described in this Agreement, based on actual billable hours recorded and invoiced periodically. Payment terms: {{payment_terms}}. Accepted payment method: {{payment_method}}. Amounts are billed based on hours actually worked, not a fixed fee, unless otherwise agreed in writing by both parties.

4. Expenses.
The Client shall reimburse the Service Provider for all reasonable and pre-approved out-of-pocket expenses incurred in connection with the performance of the services under this Agreement. Receipts or other appropriate documentation must be provided for all expenses claimed.

5. Independent Contractor Status.
The Service Provider is an independent contractor and not an employee, agent, or partner of the Client.

6. Confidentiality.
The Service Provider agrees not to disclose or use any of the Client's confidential information without prior written consent.

7. Intellectual Property.
All intellectual property created by the Service Provider in connection with this Agreement shall be the property of the Client upon full payment, unless otherwise agreed in writing by both parties. The Service Provider may not use or share such intellectual property without the Client's written consent.

8. Termination.
Either party may terminate this Agreement, with or without cause, by providing [FILL IN: notice period, e.g. 30] days' written notice to the other party. Either party may terminate immediately for cause if the other party fails to comply with any term of this Agreement and does not resolve the issue within [FILL IN: cure period, e.g. 15] days after receiving written notice. Upon termination, the Service Provider will be compensated for all hours worked up to the effective date of termination.

9. Warranties and Representations.
Each party warrants that it has the power to enter into this Agreement and has obtained all necessary approvals.

10. Liability.
The Service Provider's total liability under this Agreement is limited to $[FILL IN: liability cap, or "the total fees paid by the Client under this Agreement"].

11. Governing Law.
This Agreement shall be governed by and construed in accordance with the laws of [FILL IN: state/jurisdiction].

12. Entire Agreement.
This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements.

13. Amendments.
Any amendments to this Agreement must be in writing and signed by both parties.

14. Signatures.
This Agreement is agreed to and signed by the parties below.

Service Provider: {{org_name}} — approved and authorized within Cloud Performance Service Manager.

Client: {{client_name}} — signed electronically within Cloud Performance Service Manager.$body$
);
