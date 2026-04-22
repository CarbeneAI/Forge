---
name: CybersecurityPlaybooks
description: >-
  24 ATT&CK-mapped offensive security playbooks for penetration testing, red teaming, and security assessments.
  USE WHEN user mentions kerberoasting, bloodhound, active directory attacks, nmap scanning, SQL injection,
  privilege escalation, lateral movement, C2 infrastructure, metasploit, credential access, SSRF, SMB exploitation,
  memory forensics, or any specific offensive security technique. Provides step-by-step operator-grade playbooks
  with actual tool commands, detection indicators, and MITRE ATT&CK mappings. Designed for use with Talon
  (Kali Linux MCP) and Ehud (penetration testing agent).
version: "1.0"
author: CarbeneAI (playbooks adapted from mukul975/Anthropic-Cybersecurity-Skills, Apache-2.0)
license: Apache-2.0
---

# CybersecurityPlaybooks

24 curated offensive security playbooks adapted from the [Anthropic-Cybersecurity-Skills](https://github.com/mukul975/Anthropic-Cybersecurity-Skills) community project (Apache-2.0). Each playbook is operator-grade with actual tool commands, MITRE ATT&CK mappings, and detection indicators.

## Playbook Index

### Red Team (11 playbooks)

| Playbook | File | ATT&CK | Tools |
|----------|------|--------|-------|
| Kerberoasting with Impacket | `reference/RedTeam/Kerberoasting.md` | T1558.003 | impacket, hashcat |
| BloodHound CE Reconnaissance | `reference/RedTeam/BloodhoundRecon.md` | T1087.002 | bloodhound-python, SharpHound |
| Full-Scope Red Team Engagement | `reference/RedTeam/FullScopeEngagement.md` | Multiple | Full kill-chain |
| Sliver C2 Infrastructure | `reference/RedTeam/SliverC2.md` | T1071.001 | Sliver Framework |
| AD Certificate Services ESC1 | `reference/RedTeam/ADCertServicesESC1.md` | T1649 | Certipy |
| Zerologon (CVE-2020-1472) | `reference/RedTeam/Zerologon.md` | T1210 | impacket |
| NoPac (CVE-2021-42278/42287) | `reference/RedTeam/NoPac.md` | T1068 | noPac.py |
| DCSync Persistence | `reference/RedTeam/DCSync.md` | T1003.006 | mimikatz, impacket |
| WMIExec Lateral Movement | `reference/RedTeam/WMIExec.md` | T1047 | impacket |
| LaZagne Credential Access | `reference/RedTeam/LaZagne.md` | T1555 | LaZagne |
| Linux Privilege Escalation | `reference/RedTeam/LinuxPrivEsc.md` | T1548 | linpeas, GTFOBins |

### Penetration Testing (5 playbooks)

| Playbook | File | ATT&CK | Tools |
|----------|------|--------|-------|
| Metasploit Framework | `reference/PenetrationTesting/MetasploitFramework.md` | Multiple | msfconsole |
| Privilege Escalation Assessment | `reference/PenetrationTesting/PrivEscAssessment.md` | T1068 | winpeas, linpeas |
| API Security (OWASP Top 10) | `reference/PenetrationTesting/APISecurity.md` | Multiple | Burp, Postman |
| Kubernetes Pentesting | `reference/PenetrationTesting/KubernetesPentest.md` | Multiple | kubectl, kube-hunter |

### Network Security (4 playbooks)

| Playbook | File | ATT&CK | Tools |
|----------|------|--------|-------|
| Advanced Nmap Scanning | `reference/NetworkSecurity/NmapAdvanced.md` | T1046 | nmap, NSE |
| DNS Enumeration & Zone Transfer | `reference/NetworkSecurity/DNSEnumeration.md` | T1590.002 | dig, dnsenum |
| SMB Exploitation | `reference/NetworkSecurity/SMBExploitation.md` | T1210 | metasploit, crackmapexec |
| WiFi Cracking with Aircrack | `reference/NetworkSecurity/WifiCracking.md` | T1557 | aircrack-ng |

### Web Application Security (3 playbooks)

| Playbook | File | ATT&CK | Tools |
|----------|------|--------|-------|
| SQL Injection with sqlmap | `reference/WebAppSecurity/SQLInjection.md` | T1190 | sqlmap |
| Server-Side Request Forgery | `reference/WebAppSecurity/SSRF.md` | T1190 | Burp Suite |
| HTTP Request Smuggling | `reference/WebAppSecurity/HTTPSmuggling.md` | T1190 | Burp Suite |

### Forensics & Malware Analysis (2 playbooks)

| Playbook | File | ATT&CK | Tools |
|----------|------|--------|-------|
| Memory Credential Extraction | `reference/Forensics/MemoryCredentials.md` | T1003 | Volatility3 |
| Cobalt Strike Beacon Analysis | `reference/Forensics/CobaltStrikeAnalysis.md` | T1071.001 | CobaltStrikeParser |

## Usage with Talon (Kali MCP)

These playbooks are designed to work with the Talon MCP server (SSH to Kali VM at 10.0.0.50). When a playbook references a tool command, execute it via the Kali MCP:

```
User: "Run a kerberoasting attack against the lab domain"
-> Load reference/RedTeam/Kerberoasting.md
-> Execute commands via Kali MCP (SSH to 10.0.0.50)
-> Follow the playbook phases: Enumerate -> Request TGS -> Crack -> Validate
```

## Usage with Ehud (Pentest Agent)

Ehud can reference these playbooks during penetration testing engagements:

```
User: "Have Ehud test the Active Directory environment"
-> Ehud loads relevant playbooks (Kerberoasting, BloodHound, DCSync, etc.)
-> Executes structured assessment following ATT&CK kill chain
-> Generates findings mapped to MITRE techniques
```

## Legal Notice

All playbooks are for **authorized security testing and educational purposes only**. Unauthorized use against systems you do not own or have written permission to test is illegal.

## Attribution

Playbooks adapted from [mukul975/Anthropic-Cybersecurity-Skills](https://github.com/mukul975/Anthropic-Cybersecurity-Skills) (Apache-2.0 License). Original author: Mahipal Jangra.
