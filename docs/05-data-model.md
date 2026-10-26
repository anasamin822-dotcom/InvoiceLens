# Data Model

il_documents scoped by auth.uid: file metadata, private storage path, reviewed fields, server audit and optimistic revision. Each field has key/label/value/status/page/box/source/optional OCR confidence. No arbitrary-upload mock values. Boundaries: 50docs/account,10MB/file,100pages,200fields,5000events.
