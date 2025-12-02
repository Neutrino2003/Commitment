
## Stored Cross-Site Scripting (XSS)

**Severity:** Medium
**Location:** 
- `backend/commitments/views.py` (lines 133, 219, 301, 415, 455, 587)
- `backend/commitments/models.py`

**Line Content:**
- `evidence_text = serializer.validated_data.get('evidence_text', '')`
- `reason = serializer.validated_data.get('reason', '')`
- `complaint_text = serializer.validated_data.get('complaint_text', '')`
- `complaint = serializer.save(user=self.request.user)`
- `review_notes = serializer.validated_data.get('review_notes', '')`
- `notes = serializer.validated_data.get('notes', '')`

**Description:**
Multiple fields throughout the `commitments` app accept user-provided text and store it in the database without any sanitization or escaping. If this data is ever rendered on the frontend without proper escaping, it could lead to Stored Cross-Site Scripting (XSS) attacks. An attacker could inject malicious scripts that would be executed in the browsers of other users, potentially leading to session hijacking, data theft, or other malicious actions.

The following fields and the corresponding database fields are affected:
- In `CommitmentViewSet.mark_completed`, `evidence_text` is saved to `Commitment.evidence_text`.
- In `CommitmentViewSet.mark_failed`, `reason` is saved to `Commitment.complaint`.
- In `CommitmentViewSet.flag_complaint`, `complaint_text` is saved to `Commitment.complaint`.
- In `ComplaintViewSet.perform_create`, `description` is saved to `Complaint.description`.
- In `ComplaintViewSet.review`, `review_notes` is saved to `Complaint.review_notes`.
- In `EvidenceVerificationViewSet.verify`, `notes` is saved to `EvidenceVerification.notes` and also to `Commitment.complaint`.

**Recommendation:**
While the ultimate fix is to ensure that all user-provided content is properly escaped on the frontend before being rendered, it is a good practice to also sanitize user input on the backend as a defense-in-depth measure. Consider using a library like `bleach` to clean the HTML and prevent malicious tags and attributes from being stored in the database.

For example, before saving the `evidence_text`:
```python
import bleach

...

evidence_text = serializer.validated_data.get('evidence_text', '')
sanitized_evidence_text = bleach.clean(evidence_text)
contract.evidence_text = sanitized_evidence_text
```
This should be applied to all the fields listed above.
