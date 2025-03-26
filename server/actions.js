import MoveAction from "./actions/move_action.js"
import DoorAction from "./actions/door_action.js"
import ExamineAction from "./actions/examine_action.js"
import TransportAction from "./actions/transport_action.js"
import PickUpAction from "./actions/pick_up_action.js";
import DropAction from "./actions/drop_action.js";
import MessageAction from "./actions/message_action.js";
import InventoryAction from "./actions/inventory_action.js";
import UseAction from "./actions/use_action.js";
import EatAction from "./actions/eat_action.js";
import PickAction from "./actions/pick_action.js";
import WearAction from "./actions/wear_action.js";
import RemoveAction from "./actions/remove_action.js";
import TalkAction from "./actions/talk_action.js";
import RotateAction from './actions/rotate_action.js';
import AttackAction from "./actions/attack_action.js";
import TradeAction from "./actions/trade_action.js";
import PriceAction from "./actions/price_action.js";
import BuyAction from "./actions/buy_action.js";
import ValueAction from "./actions/value_action.js";
import SellAction from "./actions/sell_action.js";
import FollowAction from "./actions/follow_action.js";
import TradePlayerAction from "./actions/trade_player_action.js";
import OfferAction from "./actions/offer_action.js";
import RemoveOfferAction from "./actions/remove_offer_action.js";
import ChopAction from "./actions/chop_action.js";
import MineAction from "./actions/mine_action.js";
import DefaultAction from "./actions/default_action.js";
import FishAction from "./actions/fish_action.js";
import SmithAction from "./actions/smith_action.js";
import CharacterConfigureAction from "./actions/character_configure_action.js";
import ChangeNameAction from "./actions/change_name_action.js";
import PrayAction from "./actions/pray_action.js";
import TogglePrayerAction from "./actions/toggle_prayer_action.js";
import ToggleChatAction from "./actions/toggle_chat_action.js";
import ResetAccountAction from "./actions/reset_account_action.js";
import WeedAction from "./actions/weed_action.js";
import * as TutorialIslandQuest from './quests/q000_tutorial_island.js';
import TimePlayedAction from "./actions/time_played_action.js";
import HarvestAction from "./actions/harvest_action.js";
import ToggleAction from "./actions/toggle_action.js";
import DepositAction from "./actions/deposit_action.js";
import WithdrawAction from "./actions/withdraw_action.js";
import BankAction from "./actions/bank_action.js";
import PushAction from "./actions/push_action.js";
import * as CanoeQuest from './quests/q010_canoe.js';
import ToggleMusicAction from "./actions/toggle_music_action.js";
import ToggleSfxAction from "./actions/toggle_sfx_action.js";
import ToggleMacroAction from "./actions/toggle_macro_action.js";
import { ExamineResourceAction, WithdrawResourceAction } from "./resources.js";
import PatAction from "./actions/pat_action.js";
import ToggleDLCRAction from "./actions/toggle_dlcr_action.js";
import ToggleGraphicsAction from "./actions/toggle_graphics_action.js";
import ToggleHroofAction from "./actions/toggle_hroof_action.js";
import CollectionLogAction from "./actions/collection_log_action.js";
import ExamineMonsterAction from "./actions/examine_monster.js";
import PVPAreaAction from "./actions/pvp_area.js";
import ToggleHxpAction from "./actions/toggle_hxp_action.js";
import CustomNameAction from "./actions/custom_name_action.js";
import BlockAction from "./actions/block_action.js";

export default {
    "move": MoveAction,
    "door": DoorAction,
    "examine": ExamineAction,
    "transport": TransportAction,
    "pick_up": PickUpAction,
    "drop": DropAction,
    "message": MessageAction,
    "inventory": InventoryAction,
    "use": UseAction,
    "eat": EatAction,
    "pick": PickAction,
    "wear": WearAction,
    "remove": RemoveAction,
    "talk": TalkAction,
    "rotate": RotateAction,
    "attack": AttackAction,
    "trade": TradeAction,
    "price": PriceAction,
    "buy": BuyAction,
    "value": ValueAction,
    "sell": SellAction,
    "follow": FollowAction,
    "trade_player": TradePlayerAction,
    "offer": OfferAction,
    "remove_offer": RemoveOfferAction,
    "chop": ChopAction,
    "mine": MineAction,
    "default": DefaultAction,
    "fish": FishAction,
    "smith": SmithAction,
    "character_configure": CharacterConfigureAction,
    "change_name": ChangeNameAction,
    "pray": PrayAction,
    "toggle_prayer": TogglePrayerAction,
    "toggle_chat": ToggleChatAction,
    "reset_account": ResetAccountAction,
    "time_played": TimePlayedAction,
    "weed": WeedAction,
    "harvest": HarvestAction,
    "toggle": ToggleAction,
    "deposit": DepositAction,
    "withdraw": WithdrawAction,
    "bank": BankAction,
    "push": PushAction,
    "toggle_music": ToggleMusicAction,
    "toggle_sfx": ToggleSfxAction, 
    "toggle_macro": ToggleMacroAction,
    "examine_resource": ExamineResourceAction,
    "withdraw_resource": WithdrawResourceAction,
    "pat": PatAction,
    "toggle_dlcr": ToggleDLCRAction,
    "toggle_graphics": ToggleGraphicsAction,
    'toggle_hroof': ToggleHroofAction,
    "collection_log": CollectionLogAction,
    "examine_monster": ExamineMonsterAction,
    "pvp_area": PVPAreaAction,
    "toggle_hxp": ToggleHxpAction,
    "custom_name": CustomNameAction,
    "block": BlockAction,

    // custom quest actions
    "q000_build": TutorialIslandQuest.DockBuildAction,
    "q000_sail": TutorialIslandQuest.DockSailAction,

    "q010_build": CanoeQuest.CanoeBuildAction,
    "q010_sail": CanoeQuest.CanoeSailAction
}