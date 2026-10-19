# Skill name rules

`pai-new-skill` accepts exactly one skill name. The name must start with an
ASCII letter or number and may contain only ASCII letters, numbers, periods,
underscores, or hyphens. The helper rejects separators and other characters
before attempting to create a skill directory. The offline tests exercise this
behavior in Bash and Zsh using disposable checkouts.

This validates the supplied name; it is not a filesystem sandbox against a
pre-existing or concurrently changed path. Keep the checkout writable only by
trusted local users while creating skills.

Contributed by Ryan Wentzel | [ryanwentzel.me](https://ryanwentzel.me).
