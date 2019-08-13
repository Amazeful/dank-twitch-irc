import { assert } from "chai";
import * as sinon from "sinon";
import { ClientError, ConnectionError, MessageError } from "../client/errors";
import { assertErrorChain, fakeConnection } from "../helpers.spec";
import { removeCommands, say, SayError } from "./say";

describe("./operations/say", function() {
  describe("#removeCommands()", function() {
    it("should remove all twitch commands", function() {
      assert.strictEqual(removeCommands("/me hi"), "/ /me hi");
      assert.strictEqual(removeCommands(".me hi"), "/ .me hi");
      assert.strictEqual(
        removeCommands("/timeout weeb123 5"),
        "/ /timeout weeb123 5"
      );
    });

    it("should not prepend a slash to other messages", function() {
      assert.strictEqual(removeCommands(""), "");
      assert.strictEqual(removeCommands("\\me hi"), "\\me hi");
      assert.strictEqual(removeCommands("hello world!"), "hello world!");
    });
  });

  describe("SayError", function() {
    it("should not be instanceof ConnectionError", function() {
      assert.notInstanceOf(new SayError("pajlada", "test"), ConnectionError);
    });
    it("should not be instanceof ClientError", function() {
      assert.notInstanceOf(new SayError("pajlada", "test"), ClientError);
    });
  });

  describe("#say()", function() {
    it("should send the correct wire command", function() {
      sinon.useFakeTimers();
      const { transport, client } = fakeConnection();

      say(client, "pajlada", "/test test abc KKona");

      assert.deepStrictEqual(transport.data, [
        "PRIVMSG #pajlada :/ /test test abc KKona\r\n"
      ]);
    });

    it("should resolve on USERSTATE", async function() {
      const { client, clientError, emitAndEnd } = fakeConnection();

      const promise = say(client, "pajlada", "/test test abc KKona");

      const userstateResponse =
        "@badge-info=;badges=;color=;display-name=justinfan12345;emote-sets=0;mod=0;" +
        "subscriber=0;user-type= :tmi.twitch.tv USERSTATE #pajlada";
      emitAndEnd(userstateResponse);

      const response = await promise;
      assert.strictEqual(response.rawSource, userstateResponse);

      await clientError;
    });

    it("should reject on msg_channel_suspended", async function() {
      const { client, clientError, emitAndEnd } = fakeConnection();

      const promise = say(client, "pajlada", "abc def");

      emitAndEnd(
        "@msg-id=msg_channel_suspended :tmi.twitch.tv NOTICE" +
          " #pajlada :This channel has been suspended."
      );

      await assertErrorChain(
        promise,
        SayError,
        "Failed to say [#pajlada]: abc def",
        MessageError,
        "Bad response message: @msg-id=msg_channel_suspended :tmi.twitc" +
          "h.tv NOTICE #pajlada :This channel has been suspended."
      );

      await assertErrorChain(
        clientError,
        SayError,
        "Failed to say [#pajlada]: abc def",
        MessageError,
        "Bad response message: @msg-id=msg_channel_suspended :tmi.twitc" +
          "h.tv NOTICE #pajlada :This channel has been suspended."
      );
    });
  });
});
