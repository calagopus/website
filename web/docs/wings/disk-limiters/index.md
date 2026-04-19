# Disk Limiters

Ever heard of "Pterodactyl-Destroyer" or similar Tools? They are all based on the same principle, they abuse the fact that Pterodactyl doesn't have a quota system for disk space, and they create a file that fills up the entire disk, causing other servers on the same node to be affected, and potentially causing the node to crash. This is a common attack vector for malicious users, and it's something that has been a problem for Pterodactyl for a long time.

At Calagopus we have multiple Systems in place that can prevent this, not all are applicable to everyone.
