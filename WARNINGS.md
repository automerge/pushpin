# WARNINGs

PushPin is free, open source software and comes with no guarantees of reliability, security, or privacy.

While we have made efforts to make PushPin work, you should be aware of the following risks:

# We may corrupt your data. 
PushPin is new software and uses a novel storage engine which may have bugs.

# We might accidentally leak your data.
It's possible our collaboration engine will inadvertantly share access with other users. We recommend strongly against storing highly personal or sensitive data in PushPin!

# Your IP address will be shared with any users you encounter. 
Because PushPin is peer-to-peer software, it aggressively connects to other peers with whom you share documents in common, including, for example, identity documents. 

# You cannot unshare documents or block contributions from other users.
Once a key is published we do not support rotation or rescinding that key. Anyone with that key will be able to follow progress on that document forever.

# Performance may degrade over time.
If you have too many documents, the application may become gradually slower, even to the point of being unusable.

# You cannot block changes from other users!
We do not currently have support for blocking writes to documents from people you've shared with (or who they've shared with). Other people can edit anything they see, including your contact document.

# None of your data is encrypted.
Your data is stored unencrypted both locally and on peers' machines. Specifically, anyone with system access to your storage peer can read the data there.

# Nothing in PushPin protects against impersonation of users.
We do not have any identity-spoofing protection. Anyone can set their name to your name. Anyone can set your name to their name. There is no way currently to avoid or prevent this.

# Treat your root workspace URL as your greatest secret!
If your workspace URL is leaked, anyone who has it can read all of your data and impersonate you forever without you realizing.

# There is no way to remove something from a documents' history
The full history of a document is always preserved and can never be redacted. If you paste a password into a document it will still be there, even if you delete the document.

# Your shared documents are semi-public.
Shared document contents are private, but anyone who has encountered your profile can see the contact document for anyone you have shared data with.
