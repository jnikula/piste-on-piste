.. SPDX-License-Identifier: CC-BY-SA-4.0
.. Copyright (c) 2022 Jani Nikula <jani@nikula.org>

.. _manual:

Piste on Piste Manual
=====================

:Copyright: 2022 Jani Nikula <jani@nikula.org>
:License: `Creative Commons Attribution Share Alike 4.0 International`_ (CC-BY-SA-4.0)

.. _Creative Commons Attribution Share Alike 4.0 International:
  https://spdx.org/licenses/CC-BY-SA-4.0.html

This is the Piste on Piste [*]_ three-player snooker scoreboard app user guide.

Please read the :ref:`rules-en` first.

The app currently works best in tablet size screens in landscape.

.. note::

   This manual is a work-in-progress, and does not cover everything.

.. contents::

Introduction
------------

The app consists of four different pages described below: `Start Page`_, `Main
Page`_, `Stats Page`_, and `Edit Page`_.

License
~~~~~~~

The scoreboard app is free software, released under the `GNU General Public
License v3.0 or later`_ (AGPL-3.0-or-later).

.. _GNU General Public License v3.0 or later:
  https://spdx.org/licenses/AGPL-3.0-or-later.html

Privacy
~~~~~~~

After loading and launching the app, no further network connection is required
or used. All game state, including player names, is stored in the browser local
storage only, and never sent anywhere.

Start Page
----------

This, obviously, is where you start. You can either start a new game or load a
previously auto-saved game.

You also end up here if you hit reload in the browser. If you do this in the
middle of a game, perhaps by accident, you probably want to load the most recent
saved game.

To start a new game:

1. Enter player names.

2. Press the **SHUFFLE** button if you wish to randomize start order for the
   first frame.

3. Press the **NEW GAME** button to start the game.

The three most recent games are auto-saved in browser local storage, with their
entire undo histories, and you can continue them here. Press the **LOAD GAME**
button of the game you wish to continue. Starting a new game throws away the
oldest saved game.

Starting or loading a game takes you to the `Main Page`_.

Main Page
---------

This is the main play view.

The player whose turn it is to play is indicated by a white border (or red
border when the player has been requested to play again).

Press the snooker ball buttons to pot (numbers **1-7** on the keyboard).

* If you pot two or more reds at a time, hit the red ball button again as
  required.

* If you pot a free ball, hit the correct button for points here, and increase
  the number of balls left on the `Edit Page`_.

* If, after all balls have been potted, two (or all) players have equal points,
  the game continues with a re-spotted black. The app reminds you to re-spot it.

Press the foul ball buttons to enter fouls (**f** key immediately followed by
numbers **4-7** on the keyboard).

* If you pot a red ball while committing a foul, decrease the number of balls
  left on the `Edit Page`_.

* It's currently not possible to record fouls for playing out of turn. Adjust
  the points manually on the `Edit Page`_.

* If the previous player committed a foul, you can request them to play again
  using the **PLAY AGAIN** button.

* If there's a foul with just the last black remaining, the frame ends. If two
  (or all) players have equal points, the game continues with a re-spotted
  black. The app reminds you to re-spot it.

Press the **END TURN** button to end turn (space bar on the beyboard). Fouls end
turn automatically.

.. include:: <isoamsa.txt>

There's unlimited undo/redo with the |cularr| and |curarr| buttons (**z** and
**y** keys on the keyboard).

Press the **...** button to proceed to `Stats Page`_ (right arrow on the
keyboard).

Stats Page
----------

This is an info screen with stats about frame and game. You can also concede and
start new frames here.

Per player breaks are shown as balls potted, as well as fouls with a minus in
front.

If the last player needs snookers to catch the second player, and it's not their
turn, they can concede using the **CONCEDE** button.

If the second and last player need snookers to catch the first player, and it's
not the first player's turn, the second and last player can concede the frame
using the **SET WINNER** button.

After conceding or setting the winner, the remaining players continue to
determine their order.

When the current frame is over, press the **NEW FRAME** button to start a new
frame. You need to end the current frame first by potting all the balls and/or
conceding. (Note that frame stats are currently updated only after the new frame
is started, not when the current frame has ended.)

Press the **EDIT** button to proceed to `Edit Page`_ (right arrow on the
keyboard).

Edit Page
---------

This page lets you edit the number of balls remaining as well as points for each
player.

Press the **-** and **+** buttons for each player to adjust their score.

Press the fix **-** and **+** buttons to adjust the number of balls left (**-**
and **+** on the keyboard).

Note that edits don't currently immediately impact any win/lose/end-of-frame
conditions. You need to end the current turn to make that happen.

Press the **CONTINUE** button to proceed to `Main Page`_ (right arrow on the
keyboard).

.. [*] Finnish for "a point is a point".
