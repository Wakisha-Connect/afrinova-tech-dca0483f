(() => {
  const site = window.WAKISHA_SITE;
  if (!site?.content) return;

  const content = site.content;
  const templateConfig = site.templateConfig || {};
  const uiText = site.uiText || {};
  const common = uiText.common || {};
  const contact = content.contact || {};
  const get = (path, source = content) =>
    String(path)
      .split('.')
      .reduce((value, key) => (value == null ? undefined : value[key]), source);
  const first = (paths, fallback = '') => {
    for (const path of paths || []) {
      const value = get(path);
      if (Array.isArray(value) && value.length) return value;
      if (value != null && value !== '') return value;
    }
    return fallback;
  };
  const text = (value, fallback = '') => {
    if (Array.isArray(value)) return value.filter(Boolean).join(', ');
    return value == null || value === '' ? fallback : String(value);
  };
  const escape = (value) =>
    text(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  const setText = (selector, value) => {
    const next = text(value);
    if (!next) return;
    document.querySelectorAll(selector).forEach((node) => {
      node.textContent = next;
    });
  };
  const setTextElement = (node, value) => {
    const next = text(value);
    if (!node || !next) return;
    node.textContent = next;
  };
  const setLabelText = (label, value) => {
    const next = text(value);
    if (!label || !next) return;
    const textNode = Array.from(label.childNodes).find(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
    );
    if (textNode) {
      textNode.textContent = next + ' ';
      return;
    }
    label.prepend(document.createTextNode(next + ' '));
  };
  const applySlots = () => {
    (content.slots || []).forEach((slot) => {
      const next = text(slot.value);
      if (!slot.selector || !next) return;

      document.querySelectorAll(slot.selector).forEach((node) => {
        if (slot.kind === 'placeholder') {
          node.setAttribute('placeholder', next);
          return;
        }
        if (slot.kind === 'aria-label') {
          node.setAttribute('aria-label', next);
          return;
        }
        if (slot.kind === 'title') {
          node.setAttribute('title', next);
          return;
        }

        const textNode = Array.from(node.childNodes).find(
          (child) =>
            child.nodeType === Node.TEXT_NODE && child.textContent.trim(),
        );
        if (textNode) {
          textNode.textContent = next;
          return;
        }
        node.textContent = next;
      });
    });
  };

  window.addEventListener('DOMContentLoaded', () => {
    document.title = text(content.name, document.title);

    (templateConfig.textBindings || []).forEach((binding) => {
      setText(
        binding.selector,
        text(binding.prefix || '') + text(first(binding.paths, binding.fallback)),
      );
    });
    setText('.contact-section p:last-of-type, #contact p:last-of-type', [
      contact.email,
      contact.phone,
      contact.location,
      contact.website,
    ].filter(Boolean).join(' - '));

    Object.entries(uiText.sections || {}).forEach(([sectionId, label]) => {
      document
        .querySelectorAll(
          '.site-nav a[href="#' +
            sectionId +
            '"], .footer-links a[href="#' +
            sectionId +
            '"]',
        )
        .forEach((link) => {
          link.textContent = text(label);
        });

      const section = document.getElementById(sectionId);
      const eyebrow = section?.querySelector('.eyebrow');
      if (eyebrow) {
        const icon = eyebrow.querySelector('i')?.outerHTML;
        eyebrow.innerHTML = icon ? icon + ' ' + escape(label) : escape(label);
      }
    });

    (templateConfig.listBindings || []).forEach((binding) => {
      const items = get(binding.path);
      if (!Array.isArray(items) || !items.length) return;
      document.querySelectorAll(binding.selector).forEach((root) => {
        const nodes =
          binding.itemTag === 'span'
            ? Array.from(root.querySelectorAll('span'))
            : Array.from(root.querySelectorAll('article, li'));

        items.slice(0, nodes.length).forEach((item, index) => {
          const node = nodes[index];
          if (binding.itemTag === 'span' || binding.itemTag === 'li') {
            const icon = node.querySelector('i')?.outerHTML;
            const label = text(binding.titlePath ? get(binding.titlePath, item) : item);
            node.innerHTML = icon ? icon + ' ' + escape(label) : escape(label);
            return;
          }

          const title =
            node.querySelector('h3') ||
            node.querySelector('strong') ||
            node.querySelector('summary');
          const body = node.querySelector('p');
          const label = node.querySelector('span, small');

          setTextElement(
            label,
            binding.eyebrowPath ? get(binding.eyebrowPath, item) : undefined,
          );
          setTextElement(
            title,
            binding.titlePath ? get(binding.titlePath, item) : item,
          );
          setTextElement(
            body,
            binding.bodyPath ? get(binding.bodyPath, item) : undefined,
          );
        });
      });
    });

    (content.sections || []).forEach((section) => {
      const root = document.getElementById(section.id);
      if (!root) return;
      const heading = root.querySelector('h2');
      const body = Array.from(root.querySelectorAll('p')).find(
        (node) => !node.classList.contains('eyebrow'),
      );
      if (heading && section.title) heading.textContent = text(section.title);
      if (body && section.body) body.textContent = text(section.body);

      if (Array.isArray(section.items) && section.items.length) {
        const cards = Array.from(
          root.querySelectorAll(
            'article, details, .proof-card, .promise-card, .product-flow article',
          ),
        );

        section.items.slice(0, cards.length).forEach((item, index) => {
          const card = cards[index];
          const title =
            card.querySelector('h3') ||
            card.querySelector('strong') ||
            card.querySelector('summary');
          const cardBody = card.querySelector('p');
          const label = card.querySelector('span, small');

          if (label && item.label) label.textContent = text(item.label);
          if (title && item.title) title.textContent = text(item.title);
          if (cardBody && item.body) cardBody.textContent = text(item.body);
        });
      }
    });

    const setLinkLabel = (link, label) => {
      const next = text(label, link.textContent);
      const icon = link.querySelector('i')?.outerHTML;
      link.innerHTML = icon ? icon + ' ' + escape(next) : escape(next);
    };

    document.querySelectorAll('a.button.primary, .nav-cta').forEach((link) => {
      setLinkLabel(link, site.content?.cta?.primary);
      if (contact.email && link.getAttribute('href') === '#contact') {
        link.setAttribute('href', 'mailto:' + contact.email);
      }
    });
    document.querySelectorAll('a.button.secondary').forEach((link) => {
      setLinkLabel(link, site.content?.cta?.secondary);
    });

    setText('.demo-toolbar strong', common.productWalkthrough);
    setText('.screen-copy span', common.launchChecklist);
    setText('.screen-copy strong', common.readyBuyers);
    const demoSteps = document.querySelectorAll('.demo-steps p');
    [common.problemFramed, common.proofOrganized, common.demoPath].forEach(
      (label, index) => {
        const step = demoSteps[index];
        if (!step || !label) return;
        const icon = step.querySelector('i')?.outerHTML;
        step.innerHTML = icon ? icon + ' ' + escape(label) : escape(label);
      },
    );
    const statLabels = document.querySelectorAll('.demo-stats article span');
    [common.setup, common.sections, common.intent].forEach((label, index) => {
      if (statLabels[index] && label) statLabels[index].textContent = text(label);
    });

    const formLabels = Array.from(document.querySelectorAll('form label'));
    const hasGrowthForm = Boolean(document.querySelector('.growth-form'));
    const labels = hasGrowthForm
      ? [
          common.name,
          common.email,
          common.growthFocus,
          common.whatShouldImprove,
        ]
      : [common.name, common.email, common.stage, common.demoQuestion];

    labels.forEach((label, index) => {
      const node = formLabels[index];
      if (!node || !label) return;
      setLabelText(node, label);
    });
    document
      .querySelectorAll('input[placeholder="Your name"]')
      .forEach((input) => input.setAttribute('placeholder', text(common.namePlaceholder)));
    document
      .querySelectorAll('textarea')
      .forEach((textarea) =>
        textarea.setAttribute(
          'placeholder',
          text(
            hasGrowthForm ? common.growthPlaceholder : common.demoPlaceholder,
          ),
        ),
      );
    const options = document.querySelectorAll('.demo-form option');
    [common.stagePreLaunch, common.stageLaunched, common.stageGrowth].forEach(
      (label, index) => {
        if (options[index] && label) options[index].textContent = text(label);
      },
    );
    const growthOptions = document.querySelectorAll('.growth-form option');
    [
      common.activation,
      common.acquisition,
      common.retention,
      common.revenue,
    ].forEach((label, index) => {
      if (growthOptions[index] && label) growthOptions[index].textContent = text(label);
    });
    document.querySelectorAll('form button.button.primary').forEach((button) => {
      button.textContent = text(
        hasGrowthForm ? common.sendGrowthBrief : common.requestDemo,
        button.textContent,
      );
    });

    setText('.dashboard-head span', common.liveSprintBoard);
    setText('.dashboard-head strong', common.growthLab);
    const footerStatus = document.querySelectorAll('.footer-status article');
    if (footerStatus[0]) {
      const first = footerStatus[0];
      setTextElement(first.querySelector('span'), common.nextSprint);
      setTextElement(first.querySelector('small'), common.briefCadence);
    }
    if (footerStatus[1]) {
      const second = footerStatus[1];
      setTextElement(second.querySelector('span'), common.bestFit);
      setTextElement(second.querySelector('strong'), common.growthStageTeams);
    }
    setText('.apply-note span', common.goodInputs);

    setText('.footer-intro p, .site-footer .footer-grid p', common.footerDescription);
    setText('.footer-main p', common.footerDescription);
    document.querySelectorAll('.footer-bottom span:first-child').forEach((node) => {
      node.innerHTML =
        'Copyright © <span class="current-year">' +
        new Date().getFullYear() +
        '</span> ' +
        escape(content.name || '') +
        '. ' +
        escape(common.copyrightSuffix || '');
    });
    setText('.footer-bottom span:last-child', common.generatedBy);
    applySlots();
  });
})();

const header = document.querySelector('.site-header');
const toggle = document.querySelector('.menu-toggle');
toggle?.addEventListener('click', () => header?.classList.toggle('is-open'));
document
  .querySelectorAll('a[href^="#"]')
  .forEach((link) =>
    link.addEventListener('click', () => header?.classList.remove('is-open')),
  );
document.querySelectorAll('.current-year').forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});
