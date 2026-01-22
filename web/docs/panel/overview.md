# Panel

The Calagopus **Panel** is the central management interface for administering game servers and related services. It provides a user-friendly web interface and a robust backend to handle server orchestration, user management, and various integrations. This will not actually host any game servers yet, for that you will need to install [Wings](../wings/overview.md).

## Minimum Requirements

Before installing the Calagopus **Panel**, ensure that your system meets the following minimum requirements:

- **Operating System**: Windows 10 or later, MacOS, Ubuntu 22.04 LTS or later, Debian 11 or later, or anything that supports modern Docker versions
- **CPU Architecture**: x86_64, ARM64, RISC-V or PPC64LE
- **RAM**: Minimum 512 MB (1 GB or more recommended, 2 GB recommended when using extensions)
- **Disk Space**: At least 1 GB of free disk space, at least 20 GB recommended when using extensions

### Real World Usage Example

Here is an example of a Calagopus Panel running with 50 servers managed on x86_64 hardware:

```bash
CONTAINER ID   NAME                 CPU %     MEM USAGE / LIMIT     MEM %     NET I/O         BLOCK I/O        PIDS
1d385d84abbc   rjns-control_web     0.00%     88.47MiB / 91.99GiB   0.09%     671MB / 258MB   473MB / 345MB    31
775c970479c2   rjns-control_db      0.00%     66.44MiB / 91.99GiB   0.07%     190MB / 163MB   228MB / 686MB    20
f5925cc2dd3f   rjns-control_cache   0.09%     3.832MiB / 91.99GiB   0.00%     293MB / 18MB    12.8MB / 332MB   7
```

Keep in mind that when using extensions you will need additional resources for compiling the panel frontend and backend.
This example only reflects the base panel usage without any extensions installed.
