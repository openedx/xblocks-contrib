"""
Tests stringify functions used in xmodule html
"""

from lxml import etree

from xblocks_contrib.problem.stringify import stringify_children


def test_stringify():
    text = 'Hi <div x="foo">there <span>Bruce</span><b>!</b></div>'
    html = f"""<html a="b" foo="bar">{text}</html>"""
    xml = etree.fromstring(html)
    out = stringify_children(xml)
    assert out == text


def test_stringify_again():
    html = r"""<html name="Voltage Source Answer" >A voltage source is non-linear!
<div align="center">
    <img src="/static/images/circuits/voltage-source.png"/>
    \(V=V_C\)
  </div>
  But it is <a href="http://mathworld.wolfram.com/AffineFunction.html">affine</a>,
  which means linear except for an offset.
  </html>
"""

    html = """<html>A voltage source is non-linear!
  <div align="center">

  </div>
  But it is <a href="http://mathworld.wolfram.com/AffineFunction.html">affine</a>,
  which means linear except for an offset.
  </html>
  """
    xml = etree.fromstring(html)
    out = stringify_children(xml)

    # Tracking strange content repeating bug
    # Should appear once
    assert out.count("But it is ") == 1
