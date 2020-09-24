
const typingAnimations: {[id: string]: any} = {};
const AnimationDuration = 0.75;
export default function typingAnimation(el: HTMLElement, text: string) {
  if (el.id in typingAnimations)
    clearInterval(typingAnimations[el.id].interval);

  if (!text) text = el.innerText;
  typingAnimations[el.id] = {
    el: el,
    text: text,
    lastUpdate: Date.now(),
    length: 0,
    typingSpeed: text.length / (AnimationDuration * 1000),
    next: function() {
      const _this = typingAnimations[el.id];
      const now = Date.now();
      const dt = now - _this.lastUpdate;
      _this.lastUpdate = now;
      _this.length += dt * _this.typingSpeed;
      _this.el.innerText = _this.text.substring(0, _this.length);
      if (_this.length > _this.text.length) {
        _this.el.innerText = _this.text;
        clearInterval(_this.interval);
      }
    }
  };

  typingAnimations[el.id].interval =
      setInterval(typingAnimations[el.id].next, 0);
}