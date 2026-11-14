# Omnecarta rebuild verification

The web app includes Explore Omnecarta, Play Story and My Collection. Browser coverage runs in desktop Chrome and a mobile Chrome viewport with emulated touch. The production build uses Node.js 24 and Vite.

- Open the Moon and Mars guides, compare their surface conditions, and inspect both exhibits before playing. Reload a direct exhibit route and confirm that browsing leaves My Collection empty.
- Start Play Story at the homepage. Move Astra with the keyboard or touch direction controls, scan two landmarks, and follow distance, bearing, and signal strength to the wreck. Confirm that the graph receives distinct readings and a reload restores position and observations.
- Let the timed scanner prompt expire, retry successfully, and separately verify the untimed alternative and reduced motion behavior.
- Inspect and recover all three parts at separate positions. Reject a wrong mount and a wrong orientation. Fit all parts, reload My Collection, and confirm that it still contains one Opportunity record. Replay starts a fresh mission and preserves the collection. Dragging the camera onto its mast was checked separately in the 3D workbench.
- Verify the keyboard exhibit controls, a forced viewer failure, the optional dust experiment, and links to approved NASA records.

The public site links only to the approved NASA Space Science Data Coordinated Archive, Lunar Roving Vehicles, and Spirit & Opportunity entries. The two archived NASA images appear directly in the Spirit & Opportunity record. The other visuals are original illustrations.
