# PlayCanvas Odyssey implementation status

Snapshot: 14 November 2026.

Odyssey now runs in PlayCanvas Engine 2.24.1. The existing atlas and exhibit routes retain their existing renderer. The PlayCanvas editor connector was occupied; this implementation uses the standalone Engine API.

Implemented: modeled cockpit, circular radar and physical console controls, immediate steering and throttle, scans using position and bearing diversity, persistent surface locks, approach, touchdown interaction, hatch and Astra exit, recovery, keyed three-dimensional assembly, Mars and Moon chapter state. Records are optional and do not gate scans.

Verified for this snapshot: TypeScript check and production build; desktop and phone opening renders without JavaScript errors. The phone render still needs console placement refinement. Full mission interaction, continuous recording and production deployment have not yet been verified for this snapshot. Do not treat implementation as completed playthrough validation.

The glTF files in public/models are exports of the project ship, Astra, lunar rover, and the NASA VTAD MER model described in assets.md. Astra's updated underlying body rig uses the CC0 RobotExpressive source recorded in public/vendor/astra/MODEL-LICENSE.md and sources.json. The binocular head, neck, drape and cable are original project art. pc-export.html and pc-lunar-export.html are the export authoring views. The authored canyon is a fictional environment, not NASA topographic data.
