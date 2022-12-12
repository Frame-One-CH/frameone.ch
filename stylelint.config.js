module.exports = {
  extends: ['stylelint-config-standard-scss', 'stylelint-config-prettier'],
  rules: {
    'alpha-value-notation': null,
    'color-function-notation': null,
    'declaration-block-no-redundant-longhand-properties': [
      true,
      {
        ignoreShorthands: ['/grid/'],
      },
    ],
    'selector-class-pattern': null,
    'no-descending-specificity': null,
    'scss/at-rule-conditional-no-parentheses': null,
    'scss/no-global-function-names': null,
    'scss/double-slash-comment-empty-line-before': null,
    'scss/operator-no-newline-after': null,
  },
};
