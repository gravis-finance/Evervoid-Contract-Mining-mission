//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IReferralStorage {
    function refer(address invitee, address referrer) external;
}