import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  fieldName,
  interpolate,
  isEmptyValue,
  isVisible,
  matchesCondition,
  nextStepIndex,
  splitIntoSteps,
  stepLabels,
  validateField,
  validateFields,
  type FormField,
} from '../app/lib/formLogic.ts'

/**
 * Tests for Forms by Angelo.
 *
 * The case that matters most is a conditional field: the browser and the server
 * both decide visibility with this module, and if they ever disagreed a visitor
 * would be rejected for skipping a question they were never shown.
 */

const f = (over: Partial<FormField> & { _type: string }): FormField => ({ ...over }) as FormField

describe('fieldName', () => {
  test('uses the explicit name when given', () => {
    assert.equal(fieldName(f({ _type: 'textField', name: 'company', label: 'Your company' })), 'company')
  })

  test('falls back to a name derived from the label', () => {
    assert.equal(fieldName(f({ _type: 'textField', label: 'Your Company Name!' })), 'your_company_name')
  })

  test('falls back to a positional name when there is nothing to work with', () => {
    assert.equal(fieldName(f({ _type: 'textField' }), 2), 'field_3')
  })
})

describe('isEmptyValue', () => {
  test('treats blanks, empty arrays and unticked boxes as empty', () => {
    assert.equal(isEmptyValue(''), true)
    assert.equal(isEmptyValue('   '), true)
    assert.equal(isEmptyValue([]), true)
    assert.equal(isEmptyValue(false), true)
    assert.equal(isEmptyValue(null), true)
  })

  test('treats a real answer as present', () => {
    assert.equal(isEmptyValue('yes'), false)
    assert.equal(isEmptyValue(['a']), false)
    assert.equal(isEmptyValue(true), false)
    assert.equal(isEmptyValue(0), false)
  })

  test('a composite answer is empty only when every part is', () => {
    assert.equal(isEmptyValue({ first: '', last: '' }), true)
    assert.equal(isEmptyValue({ first: 'Ada', last: '' }), false)
  })
})

describe('matchesCondition', () => {
  test('equals ignores case and surrounding space', () => {
    assert.equal(matchesCondition(' Yes ', 'equals', 'yes'), true)
  })

  test('contains matches one option of a multi-select exactly', () => {
    assert.equal(matchesCondition(['north', 'south'], 'contains', 'north'), true)
    // Without exact matching per option, "no" would match "north".
    assert.equal(matchesCondition(['north'], 'contains', 'no'), false)
  })

  test('empty and not empty', () => {
    assert.equal(matchesCondition('', 'is_empty', ''), true)
    assert.equal(matchesCondition('x', 'is_not_empty', ''), true)
  })

  test('not equals', () => {
    assert.equal(matchesCondition('a', 'not_equals', 'b'), true)
    assert.equal(matchesCondition('a', 'not_equals', 'a'), false)
  })
})

describe('isVisible', () => {
  const conditional = f({
    _type: 'textField',
    label: 'Which agency?',
    conditionalField: 'has_agency',
    conditionalOperator: 'equals',
    conditionalValue: 'yes',
  })

  test('a field with no condition always shows', () => {
    assert.equal(isVisible(f({ _type: 'textField' }), {}), true)
  })

  test('shows only when the condition is met', () => {
    assert.equal(isVisible(conditional, { has_agency: 'yes' }), true)
    assert.equal(isVisible(conditional, { has_agency: 'no' }), false)
    assert.equal(isVisible(conditional, {}), false)
  })
})

describe('validateFields', () => {
  test('a hidden required field is not demanded', () => {
    // The heart of it: the visitor never saw this question.
    const fields = [
      f({ _type: 'selectField', name: 'has_agency', label: 'Do you have an agency?' }),
      f({
        _type: 'textField',
        name: 'agency_name',
        label: 'Which agency?',
        required: true,
        conditionalField: 'has_agency',
        conditionalOperator: 'equals',
        conditionalValue: 'yes',
      }),
    ]
    assert.deepEqual(validateFields(fields, { has_agency: 'no' }), {})
    assert.ok(validateFields(fields, { has_agency: 'yes' }).agency_name)
  })

  test('layout elements are never validated', () => {
    const fields = [f({ _type: 'sectionHeading', heading: 'About you' }), f({ _type: 'htmlField' })]
    assert.deepEqual(validateFields(fields, {}), {})
  })
})

describe('validateField', () => {
  test('required fields must be answered', () => {
    assert.match(validateField(f({ _type: 'textField', label: 'Name', required: true }), '')!, /required/)
  })

  test('consent asks to tick the box rather than saying it is required', () => {
    assert.match(validateField(f({ _type: 'consentField', required: true }), false)!, /tick/)
  })

  test('email format', () => {
    assert.equal(validateField(f({ _type: 'emailField' }), 'a@b.co'), null)
    assert.ok(validateField(f({ _type: 'emailField' }), 'not-an-email'))
  })

  test('phone accepts the punctuation people actually type', () => {
    assert.equal(validateField(f({ _type: 'phoneField' }), '(415) 890-5934'), null)
    assert.ok(validateField(f({ _type: 'phoneField' }), '12345'))
  })

  test('numbers respect minimum and maximum', () => {
    const field = f({ _type: 'numberField', label: 'Budget', min: 10, max: 100 })
    assert.equal(validateField(field, '50'), null)
    assert.ok(validateField(field, '5'))
    assert.ok(validateField(field, '500'))
  })

  test('an optional field left blank is fine', () => {
    assert.equal(validateField(f({ _type: 'emailField' }), ''), null)
  })
})

describe('steps', () => {
  const fields = [
    f({ _type: 'textField', name: 'a' }),
    f({ _type: 'pageBreak', stepLabel: 'About you' }),
    f({ _type: 'textField', name: 'b' }),
    f({ _type: 'pageBreak', stepLabel: 'Your project' }),
    f({ _type: 'textField', name: 'c' }),
  ]

  test('splits on page breaks', () => {
    const steps = splitIntoSteps(fields)
    assert.equal(steps.length, 3)
    assert.deepEqual(steps.map((s) => s.length), [1, 1, 1])
  })

  test('a form with no page breaks is a single step', () => {
    assert.equal(splitIntoSteps([f({ _type: 'textField' })]).length, 1)
  })

  test('a trailing page break does not create an empty final step', () => {
    assert.equal(splitIntoSteps([f({ _type: 'textField' }), f({ _type: 'pageBreak' })]).length, 1)
  })

  test('labels line up with steps', () => {
    assert.deepEqual(stepLabels(fields), ['', 'About you', 'Your project'])
  })
})

describe('nextStepIndex', () => {
  test('goes to the next step when no rule matches', () => {
    assert.equal(nextStepIndex(0, {}, [], 3), 1)
  })

  test('never runs off the end of the form', () => {
    assert.equal(nextStepIndex(2, {}, [], 3), 2)
  })

  test('a matching rule jumps ahead', () => {
    const routing = [{ afterStep: 1, field: 'kind', operator: 'equals', value: 'skip', goToStep: 3 }]
    assert.equal(nextStepIndex(0, { kind: 'skip' }, routing, 3), 2)
    assert.equal(nextStepIndex(0, { kind: 'other' }, routing, 3), 1)
  })

  test('a rule pointing backwards is ignored rather than trapping the visitor', () => {
    const routing = [{ afterStep: 2, field: 'k', operator: 'equals', value: 'v', goToStep: 1 }]
    assert.equal(nextStepIndex(1, { k: 'v' }, routing, 3), 2)
  })

  test('a rule pointing outside the form is ignored', () => {
    const routing = [{ afterStep: 1, field: 'k', operator: 'equals', value: 'v', goToStep: 99 }]
    assert.equal(nextStepIndex(0, { k: 'v' }, routing, 3), 1)
  })
})

describe('interpolate', () => {
  test('fills placeholders', () => {
    assert.equal(interpolate('New {{formTitle}} from {{name}}', { formTitle: 'Contact', name: 'Ada' }), 'New Contact from Ada')
  })

  test('an unknown placeholder becomes empty rather than showing braces', () => {
    assert.equal(interpolate('Hello {{nope}}', {}), 'Hello ')
  })
})
