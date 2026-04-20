N.E.R.D. FEATURE SCREENS

Created files:
- nerd_assistant_command_center.html
- nerd_device_discovery_mission_control.html
- nerd_system_settings_matrix.html

What is implemented:
- Standalone, complete HTML screens matching the provided cyan/lime/magenta HUD language
- Bottom navigation linking the 3 screens together
- Material Symbols icons embedded per screen
- Responsive mobile-first layout
- Interactive shell behavior with plain JavaScript for demo/wire staging
- No external framework dependency beyond Tailwind CDN + Google Fonts/Icons, matching the source style approach

Suggested Android/WebView wiring targets:
- Assistant screen:
  - #cycle-state button -> assistant mode/state swap callback
  - .module-btn buttons -> backend command bus
  - .toggle-row / .toggle-switch -> persisted settings store
  - #append-log -> event injection or debug hook

- Discovery screen:
  - #scan-toggle -> scan.startDeepScan() or equivalent
  - .node-btn and .device-card -> selected device details route/state
  - #action-label -> label/rename flow
  - #action-isolate -> review/quarantine flow

- Settings screen:
  - .option-chip -> theme selection state
  - #intensity-slider -> visual intensity preference
  - .toggle-row / .toggle-switch -> discovery and assistant defaults
  - .profile-card -> environment profile selection
  - #save-config -> persist settings action

Notes:
- These screens are frontend-complete but intentionally avoid fake real backend behavior.
- Existing source visual language was preserved instead of inventing a different theme system.
