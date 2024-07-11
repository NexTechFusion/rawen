import * as React from 'react';
import deepEqual from 'fast-deep-equal';

function normalizeHtml(str: string): string {
  return str && str.replace(/&nbsp;|\u202F|\u00A0/g, ' ').replace(/<br \/>/g, '<br>');
}

function replaceCaret(el: HTMLElement) {
  const target = document.createTextNode('');
  el.appendChild(target);
  const isTargetFocused = document.activeElement === el;
  if (target !== null && target.nodeValue !== null && isTargetFocused) {
    var sel = window.getSelection();
    if (sel !== null) {
      var range = document.createRange();
      range.setStart(target, target.nodeValue.length);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    if (el instanceof HTMLElement) el.focus();
  }
}

export default class ContentEditable extends React.Component<any> {
  lastHtml: string = this.props.html;
  el: any = typeof this.props.innerRef === 'function' ? { current: null } : React.createRef<HTMLElement>();
  state = {
    isFocused: false,
  };

  getEl = () => (this.props.innerRef && typeof this.props.innerRef !== 'function' ? this.props.innerRef : this.el).current;

  onFocus = () => {
    this.setState({ isFocused: true });
  };

  onBlur = (e) => {
    this.setState({ isFocused: false });
    if (this.props.onBlur) {
      this.emitChange(e);
    }
  };

  render() {
    const { tagName, html, innerRef, placeholder, ...props } = this.props;
    const { isFocused } = this.state;

    const showPlaceholder = !html && !isFocused;

    return React.createElement(
      tagName || 'div',
      {
        ...props,
        ref: typeof innerRef === 'function' ? (current: HTMLElement) => {
          innerRef(current);
          this.el.current = current;
        } : innerRef || this.el,
        onInput: this.emitChange,
        onFocus: this.onFocus,
        onBlur: this.onBlur,
        onKeyUp: this.props.onKeyUp || this.emitChange,
        onKeyDown: this.props.onKeyDown || this.emitChange,
        contentEditable: !this.props.disabled,
        dangerouslySetInnerHTML: { __html: showPlaceholder ? `<div style="color: grey;">${placeholder}</div>` : html },
      },
      this.props.children
    );
  }

  shouldComponentUpdate(nextProps: any, nextState: { isFocused: boolean }): boolean {
    const { props } = this;
    const el = this.getEl();

    if (!el) return true;
    if (nextState.isFocused !== this.state.isFocused) return true;

    if (normalizeHtml(nextProps.html) !== normalizeHtml(el.innerHTML)) {
      return true;
    }

    return props.disabled !== nextProps.disabled ||
      props.tagName !== nextProps.tagName ||
      props.className !== nextProps.className ||
      props.innerRef !== nextProps.innerRef ||
      props.placeholder !== nextProps.placeholder ||
      !deepEqual(props.style, nextProps.style);
  }

  componentDidUpdate() {
    const el = this.getEl();
    if (!el) return;

    if (this.props.html !== el.innerHTML) {
      el.innerHTML = this.props.html;
    }
    this.lastHtml = this.props.html;
    replaceCaret(el);
  }

  emitChange = (originalEvt: React.SyntheticEvent<any>) => {
    const el = this.getEl();
    if (!el) return;

    const html = el.innerHTML;
    if (this.props.onChange && html !== this.lastHtml) {
      const evt = Object.assign({}, originalEvt, {
        target: {
          value: html
        }
      });
      this.props.onChange(evt);
    }
    this.lastHtml = html;
  }

  static propTypes = {
  }
}

export type ContentEditableEvent = React.SyntheticEvent<any, Event> & { target: { value: string } };
