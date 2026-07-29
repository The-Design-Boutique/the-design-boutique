// The replacement Privacy Policy, as portable text.
// Every factual claim here is checkable against the codebase: the consent
// categories, the cookie name and lifetime, and the exact fields a form
// submission stores. Nothing about retention periods, internal access or
// third-party sharing beyond what the site itself does is asserted, because
// those are business facts the code cannot tell us.
let n = 0;
const key = () => `pp${++n}`;

const h2 = (text) => ({ _key: key(), _type: 'block', style: 'h2', markDefs: [], children: [{ _key: key(), _type: 'span', marks: [], text }] });
const p = (text) => ({ _key: key(), _type: 'block', style: 'normal', markDefs: [], children: [{ _key: key(), _type: 'span', marks: [], text }] });
const strongP = (bold, rest) => ({
  _key: key(), _type: 'block', style: 'normal', markDefs: [],
  children: [
    { _key: key(), _type: 'span', marks: ['strong'], text: bold },
    { _key: key(), _type: 'span', marks: [], text: rest },
  ],
});
const li = (text) => ({ _key: key(), _type: 'block', style: 'normal', listItem: 'bullet', level: 1, markDefs: [], children: [{ _key: key(), _type: 'span', marks: [], text }] });

export const POLICY = [
  strongP('DRAFT FOR REVIEW. ', 'This wording was prepared for The Design Boutique to replace the unedited template that was carried over from the previous website. It has not been approved and is not legal advice. Please review it, with a solicitor if you prefer, before it is published. Nothing here is in force until you approve it.'),

  h2('Who we are'),
  p('The Design Boutique, Inc. This policy covers thedesignboutique.com and explains what the website collects, why, and what you can do about it.'),

  h2('When you fill in a form'),
  p('If you send us an enquiry, we keep what you typed so that we can reply to it. That is the information in the form itself, such as your name, email address and message, along with the page you were on when you sent it, the date and time, and, where present, the campaign or website that brought you to us.'),
  p('We use this to answer you and to understand which pages and campaigns produce enquiries. We do not sell it.'),
  p('If email notifications are switched on, a copy of your enquiry is sent to us by our email provider so that we see it promptly. Enquiries are also stored in the website’s content system, which is where we read and manage them.'),
  p('We may check that an email address or phone number you give us is a real one, using a verification service, to cut down on false enquiries. That check confirms whether the address or number exists. It does not tell us anything else about you.'),

  h2('Cookies and tracking'),
  p('A cookie is a small file a website stores in your browser. Some are needed for the site to work at all. Others are used to measure how the site is used or to support advertising, and those are the ones you get a say in.'),
  p('When you first visit, the site asks what you are willing to allow. Until you answer, nothing beyond the strictly necessary runs. This is not a formality: the site actively blocks the tools you have not agreed to, rather than asking them to stand down.'),
  p('There are four categories you can allow or refuse:'),
  li('Analytics. Counting visits and which pages are read, so we know what is worth writing more of.'),
  li('Advertising. Measuring advertising and building audiences. This is the category that can share information with other companies.'),
  li('Chat and call tracking. Supporting features such as a live chat window, or a phone number that records which page a call came from.'),
  li('Session recording. Tools that record activity on a page and replay it later. The site does not use any of these today. The category exists so that if one is ever added, it is blocked until you allow it.'),
  p('Strictly necessary cookies are always on and are not offered as a choice. They cover security, navigation and making forms work. They involve no tracking and nothing is shared with anybody else.'),
  p('Your answer is stored in a cookie on your own device named privacy_choices_consent, for six months, so that we do not ask again on every page. It records only which categories you allowed.'),

  h2('Your choices'),
  p('You can change your mind at any time. Every page carries a Your Privacy Choices link in the footer, and a small shield button in the corner, either of which reopens the choices.'),
  p('If your browser sends a Global Privacy Control signal, we treat that as a binding instruction not to sell or share your information, and advertising stays switched off for you. That remains the case even if the Accept all button is pressed, because a browser-level refusal is the more deliberate instruction.'),
  p('Marketing tick boxes on our forms are never pre-ticked. If you are agreeing to hear from us, it is because you ticked the box yourself.'),

  h2('Who we share information with'),
  p('The companies that run the website on our behalf can process information in order to provide their service to us: our website host, the content system where the site and its enquiries are stored, and, where configured, our email provider and the verification service described above.'),
  p('If you allow analytics or advertising cookies, information about your visit is also shared with the providers of those tools. If you refuse them, it is not.'),

  h2('How long we keep it'),
  p('Enquiries are kept for as long as we need them to deal with your enquiry and to keep proper business records. Your cookie choice is kept for six months, after which you will be asked again.'),

  h2('Your rights'),
  p('You can ask us what information we hold about you, ask for it to be corrected, or ask us to delete it. Write to us using the details below and we will respond.'),
  p('If you are a California resident, you have the right to know what personal information is collected, to have it deleted, to correct it, and to opt out of its sale or sharing. The Your Privacy Choices link is how you exercise the opt out on this website, and we honour the Global Privacy Control browser signal as described above. We will not treat you differently for exercising any of these rights.'),

  h2('Getting in touch'),
  p('Questions about this policy, or about information we hold, can be sent to us through the contact page on this website.'),

  h2('Changes to this policy'),
  p('If we change what the site collects, we will update this page and ask everyone for their cookie choices again.'),
];
