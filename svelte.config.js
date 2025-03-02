import preprocess from 'svelte-preprocess';

const ignore_warnings = [
  'a11y_no_static_element_interactions',
  'a11y_no_noninteractive_element_interactions',
  'a11y_click_events_have_key_events',
];

const config = {
  preprocess: preprocess({ }),
  compilerOptions: {
    warningFilter: (w) => ignore_warnings.indexOf(w.code) === -1,
  }
}

export default config;
